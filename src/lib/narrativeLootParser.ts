// Client-side fallback parser for detecting item pickups and drops from narrative text
// Used when AI forgets to include [LOOT:] or [DROP:] tags

export interface ParsedLoot {
  itemName: string;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern: string;
}

export interface ParsedDrop {
  itemName: string;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern: string;
}

// High-confidence patterns - these almost certainly mean the player acquired an item
const HIGH_CONFIDENCE_LOOT_PATTERNS = [
  // Direct acquisition verbs with "you" subject
  /you\s+(?:pick up|grab|take|snatch|pocket|collect|retrieve|obtain|acquire|secure|claim)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!|\s+and\s|\s+from|\s+off|\s+out)/gi,
  
  // Sling/shoulder weapon patterns (common for rifles)
  /you\s+(?:sling|shoulder|strap)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\s+over|\s+across|\s+on|\.|,|!)/gi,
  
  // Holster/stash weapon patterns
  /you\s+(?:holster|stash|store|tuck|slide)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\s+into|\s+in|\s+away|\.|,|!)/gi,
  
  // Receiving/accepting items
  /(?:hands|gives|tosses|passes|offers)\s+you\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!)/gi,
  /you\s+(?:accept|receive|catch)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!)/gi,
  
  // Inventory confirmation
  /(?:now\s+in\s+your\s+possession|add(?:ed|s)?\s+to\s+your\s+(?:inventory|pack|bag)|(?:is|are)\s+now\s+yours).*?([A-Z][a-zA-Z\s-]+)/gi,
  
  // Looting patterns  
  /(?:loot(?:ing|ed)?|search(?:ing|ed)?)\s+.*?(?:find(?:s|ing)?|discover(?:s|ing)?|reveal(?:s|ing)?)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!)/gi,
  
  // "You now have" pattern
  /you\s+now\s+have\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+)/gi,
  
  // Claiming/securing items
  /(?:claiming|securing|taking possession of)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+)/gi,
];

// Medium-confidence patterns - likely item acquisition
const MEDIUM_CONFIDENCE_LOOT_PATTERNS = [
  // Finding items
  /you\s+find\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!|\s+(?:inside|in|on|under|behind))/gi,
  /you\s+discover\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+?)(?:\.|,|!)/gi,
  
  // Picking up with less certain context
  /(?:picking up|grabbing|taking)\s+(?:the\s+|a\s+|an\s+)?([A-Z][a-zA-Z\s-]+)/gi,
];

// HIGH-CONFIDENCE DROP PATTERNS - these almost certainly mean the player lost/discarded an item
const HIGH_CONFIDENCE_DROP_PATTERNS = [
  // Direct drop/discard verbs with "you" subject
  /you\s+(?:drop|discard|throw away|toss aside|abandon|leave behind|let go of)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\.|,|!|\s+and\s|\s+on|\s+to)/gi,
  
  // "your X falls/drops/clatters"
  /your\s+([A-Za-z][a-zA-Z\s-]+?)\s+(?:falls|drops|clatters|tumbles|slips)(?:\s+to|\s+onto|\s+from|\.|,|!)/gi,
  
  // Giving away items
  /you\s+(?:give|hand|pass|offer|surrender|forfeit)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:to|over|away)/gi,
  
  // Selling items
  /you\s+(?:sell|trade|exchange|barter)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\s+for|\s+to|\.|,|!)/gi,
  
  // "where your X had already fallen"
  /where\s+your\s+([A-Za-z][a-zA-Z\s-]+?)\s+had\s+(?:already\s+)?(?:fallen|dropped|landed)/gi,
  
  // "It's already down there" pattern (contextual confirmation of drop)
  /(?:already\s+(?:down|dropped|fallen|gone)|(?:down|dropped)\s+there).*?your\s+([A-Za-z][a-zA-Z\s-]+)/gi,
  
  // Losing items
  /you\s+(?:lose|lost)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\.|,|!|\s+in|\s+to)/gi,
  
  // Items being taken from player
  /(?:takes|snatches|grabs|seizes|confiscates)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)\s+(?:from you|away)/gi,
];

// Medium-confidence drop patterns
const MEDIUM_CONFIDENCE_DROP_PATTERNS = [
  // Setting down items
  /you\s+(?:set down|put down|place|lay)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\s+on|\s+down|\.|,|!)/gi,
  
  // Releasing grip
  /you\s+(?:release|let go|loosen your grip on)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+)/gi,
  
  // Stashing temporarily (might be a drop if outside inventory)
  /you\s+(?:stash|hide|conceal)\s+(?:your\s+|the\s+|a\s+|an\s+)?([A-Za-z][a-zA-Z\s-]+?)(?:\s+behind|\s+under|\s+in)/gi,
];

// Items to exclude (common false positives)
const EXCLUDED_WORDS = new Set([
  'you', 'your', 'the', 'and', 'but', 'or', 'for', 'with', 'from',
  'moment', 'breath', 'step', 'look', 'glance', 'opportunity',
  'chance', 'time', 'position', 'stance', 'aim', 'shot', 'action',
  'deep breath', 'few steps', 'closer look', 'moment to', 'step forward',
  'head', 'hand', 'hands', 'arm', 'arms', 'eyes', 'voice', 'words',
  'guard', 'grip', 'attention', 'focus', 'composure',
]);

// Common item categories that should be captured
const ITEM_KEYWORDS = [
  'rifle', 'pistol', 'gun', 'weapon', 'sword', 'knife', 'dagger', 'blade',
  'key', 'potion', 'scroll', 'amulet', 'ring', 'necklace', 'bracelet',
  'armor', 'shield', 'helmet', 'boots', 'gloves', 'cloak', 'robe',
  'gold', 'coins', 'gem', 'jewel', 'diamond', 'ruby', 'emerald',
  'book', 'tome', 'letter', 'note', 'map', 'document', 'photograph',
  'food', 'ration', 'bread', 'water', 'flask', 'bottle',
  'torch', 'lantern', 'rope', 'grapple', 'hook', 'tools',
  'bag', 'pouch', 'backpack', 'sack', 'container', 'box', 'chest',
  'ammo', 'ammunition', 'magazine', 'clip', 'rounds', 'bullets',
  'medkit', 'bandage', 'medicine', 'syringe', 'stimpak',
  'grenade', 'explosive', 'bomb', 'mine',
  'radio', 'headset', 'phone', 'communicator', 'device', 'gadget',
  'cigarettes', 'lighter', 'matches', 'supplies',
];

function isLikelyItem(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Check if it's in the excluded words
  if (EXCLUDED_WORDS.has(lower)) return false;
  
  // Check if it contains item keywords
  for (const keyword of ITEM_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }
  
  // Check if it's capitalized and reasonable length (proper noun item)
  if (text.length >= 3 && text.length <= 50 && /^[A-Z]/.test(text)) {
    // Filter out sentence fragments
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 5) return true;
  }
  
  return false;
}

function cleanItemName(raw: string): string {
  return raw
    .trim()
    .replace(/[.,!?;:]+$/, '')  // Remove trailing punctuation
    .replace(/\s+/g, ' ')       // Normalize spaces
    .split(/\s+and\s+/i)[0]     // Take first item if "and" separates
    .trim();
}

/**
 * Parse narrative text for potential item acquisitions
 * Returns items that might have been picked up but weren't tagged with [LOOT:]
 */
export function parseNarrativeForLoot(narrative: string, existingLoot: string[] = []): ParsedLoot[] {
  const results: ParsedLoot[] = [];
  const existingLower = new Set(existingLoot.map(l => l.toLowerCase()));
  const foundItems = new Set<string>();
  
  // Check high-confidence patterns
  for (const pattern of HIGH_CONFIDENCE_LOOT_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    
    while ((match = pattern.exec(narrative)) !== null) {
      const rawItem = match[1];
      const itemName = cleanItemName(rawItem);
      const itemLower = itemName.toLowerCase();
      
      // Skip if already found or already in mechanics
      if (foundItems.has(itemLower) || existingLower.has(itemLower)) continue;
      
      if (isLikelyItem(itemName) && itemName.length >= 3) {
        foundItems.add(itemLower);
        results.push({
          itemName,
          confidence: 'high',
          matchedPattern: pattern.source.slice(0, 50) + '...'
        });
      }
    }
  }
  
  // Check medium-confidence patterns
  for (const pattern of MEDIUM_CONFIDENCE_LOOT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    
    while ((match = pattern.exec(narrative)) !== null) {
      const rawItem = match[1];
      const itemName = cleanItemName(rawItem);
      const itemLower = itemName.toLowerCase();
      
      if (foundItems.has(itemLower) || existingLower.has(itemLower)) continue;
      
      if (isLikelyItem(itemName) && itemName.length >= 3) {
        foundItems.add(itemLower);
        results.push({
          itemName,
          confidence: 'medium',
          matchedPattern: pattern.source.slice(0, 50) + '...'
        });
      }
    }
  }
  
  return results;
}

/**
 * Parse narrative text for potential item drops/discards
 * Returns items that might have been dropped but weren't tagged with [DROP:]
 */
export function parseNarrativeForDrops(narrative: string, existingDrops: string[] = [], playerInventory: string[] = []): ParsedDrop[] {
  const results: ParsedDrop[] = [];
  const existingLower = new Set(existingDrops.map(l => l.toLowerCase()));
  const inventoryLower = new Set(playerInventory.map(i => i.toLowerCase()));
  const foundItems = new Set<string>();
  
  // Check high-confidence drop patterns
  for (const pattern of HIGH_CONFIDENCE_DROP_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    
    while ((match = pattern.exec(narrative)) !== null) {
      const rawItem = match[1];
      const itemName = cleanItemName(rawItem);
      const itemLower = itemName.toLowerCase();
      
      // Skip if already found or already in mechanics drops
      if (foundItems.has(itemLower) || existingLower.has(itemLower)) continue;
      
      // Only consider drops of items the player ACTUALLY HAS in inventory
      // Use fuzzy matching to handle name variations
      const isInInventory = playerInventory.some(invItem => 
        invItem.toLowerCase().includes(itemLower) || 
        itemLower.includes(invItem.toLowerCase())
      );
      
      if (isInInventory && itemName.length >= 3) {
        foundItems.add(itemLower);
        results.push({
          itemName,
          confidence: 'high',
          matchedPattern: pattern.source.slice(0, 50) + '...'
        });
      }
    }
  }
  
  // Check medium-confidence drop patterns
  for (const pattern of MEDIUM_CONFIDENCE_DROP_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    
    while ((match = pattern.exec(narrative)) !== null) {
      const rawItem = match[1];
      const itemName = cleanItemName(rawItem);
      const itemLower = itemName.toLowerCase();
      
      if (foundItems.has(itemLower) || existingLower.has(itemLower)) continue;
      
      const isInInventory = playerInventory.some(invItem => 
        invItem.toLowerCase().includes(itemLower) || 
        itemLower.includes(invItem.toLowerCase())
      );
      
      if (isInInventory && itemName.length >= 3) {
        foundItems.add(itemLower);
        results.push({
          itemName,
          confidence: 'medium',
          matchedPattern: pattern.source.slice(0, 50) + '...'
        });
      }
    }
  }
  
  return results;
}

/**
 * Check if the narrative mentions picking up items that weren't tagged
 * Returns suggested items to add if the AI forgot [LOOT:] tags
 */
export function detectMissingLootTags(
  narrative: string, 
  mechanicsLoot: string[] = [],
  options: { minConfidence?: 'high' | 'medium' | 'low'; maxItems?: number } = {}
): string[] {
  const { minConfidence = 'medium', maxItems = 5 } = options;
  
  const parsed = parseNarrativeForLoot(narrative, mechanicsLoot);
  
  // Filter by confidence
  const confidenceOrder = ['high', 'medium', 'low'];
  const minIndex = confidenceOrder.indexOf(minConfidence);
  
  const filtered = parsed.filter(p => confidenceOrder.indexOf(p.confidence) <= minIndex);
  
  // Log what we found for debugging
  if (filtered.length > 0) {
    console.log('[LootParser] Detected potential loot not tagged:', filtered);
  }
  
  return filtered.slice(0, maxItems).map(p => p.itemName);
}

/**
 * Check if the narrative mentions dropping items that weren't tagged
 * Returns suggested items to remove if the AI forgot [DROP:] tags
 */
export function detectMissingDropTags(
  narrative: string, 
  mechanicsDrops: string[] = [],
  playerInventory: string[] = [],
  options: { minConfidence?: 'high' | 'medium' | 'low'; maxItems?: number } = {}
): string[] {
  const { minConfidence = 'high', maxItems = 5 } = options; // Default to high confidence for drops
  
  const parsed = parseNarrativeForDrops(narrative, mechanicsDrops, playerInventory);
  
  // Filter by confidence
  const confidenceOrder = ['high', 'medium', 'low'];
  const minIndex = confidenceOrder.indexOf(minConfidence);
  
  const filtered = parsed.filter(p => confidenceOrder.indexOf(p.confidence) <= minIndex);
  
  // Log what we found for debugging
  if (filtered.length > 0) {
    console.log('[DropParser] Detected potential drops not tagged:', filtered);
  }
  
  // Match detected drops to actual inventory item names
  return filtered.slice(0, maxItems).map(p => {
    // Find the actual inventory item name that matches
    const inventoryMatch = playerInventory.find(invItem => 
      invItem.toLowerCase().includes(p.itemName.toLowerCase()) || 
      p.itemName.toLowerCase().includes(invItem.toLowerCase())
    );
    return inventoryMatch || p.itemName;
  });
}
