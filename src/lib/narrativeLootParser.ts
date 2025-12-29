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

// Items to exclude (common false positives) - EXTENSIVE list to prevent garbage items
const EXCLUDED_WORDS = new Set([
  // Articles and conjunctions
  'you', 'your', 'the', 'and', 'but', 'or', 'for', 'with', 'from', 'into', 'onto',
  'a', 'an', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their',
  
  // Common verbs and verb forms
  'are', 'is', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'might', 'may',
  'can', 'must', 'shall', 'get', 'got', 'getting', 'take', 'taking', 'took',
  
  // Common adjectives
  'high', 'low', 'big', 'small', 'long', 'short', 'old', 'new', 'good', 'bad',
  'dark', 'light', 'quick', 'slow', 'hot', 'cold', 'warm', 'cool',
  
  // Body parts
  'head', 'hand', 'hands', 'arm', 'arms', 'eyes', 'eye', 'face', 'foot', 'feet',
  'leg', 'legs', 'body', 'finger', 'fingers', 'shoulder', 'shoulders',
  
  // Abstract concepts
  'moment', 'breath', 'step', 'look', 'glance', 'opportunity', 'chance', 
  'time', 'position', 'stance', 'aim', 'shot', 'action', 'way', 'place',
  'voice', 'words', 'word', 'thought', 'thoughts', 'idea', 'ideas',
  'guard', 'grip', 'attention', 'focus', 'composure', 'balance', 'control',
  'silence', 'noise', 'sound', 'sight', 'feeling', 'sense',
  
  // Common phrases that get matched
  'deep breath', 'few steps', 'closer look', 'moment to', 'step forward',
  'way out', 'way in', 'long time', 'short time', 'same time',
  
  // Location/environment words that aren't items
  'hideout', 'hideaway', 'shelter', 'location', 'area', 'zone', 'district',
  'street', 'alley', 'road', 'path', 'corridor', 'hallway', 'room', 'hall',
  'building', 'structure', 'place', 'spot', 'corner', 'side', 'edge',
  'city', 'town', 'village', 'settlement', 'outpost', 'camp', 'base',
  'midtown', 'downtown', 'uptown', 'suburb', 'slum', 'district',
  
  // Narrative/sentence fragments
  'anonymous', 'temporary', 'permanent', 'suddenly', 'quickly', 'slowly',
  'carefully', 'quietly', 'loudly', 'gently', 'roughly', 'softly',
  'away', 'forward', 'backward', 'around', 'through', 'across', 'along',
  'glimmering', 'shimmering', 'glowing', 'flickering', 'pulsing',
  'neon', 'light', 'lights', 'glow', 'shadow', 'shadows', 'darkness',
  
  // Common story words that get picked up
  'bait', 'trap', 'lure', 'trick', 'plan', 'scheme', 'plot',
  'target', 'goal', 'objective', 'mission', 'quest', 'job', 'task',
  'problem', 'trouble', 'issue', 'situation', 'circumstance',
  'danger', 'threat', 'risk', 'hazard', 'warning', 'sign',
  'clue', 'hint', 'lead', 'trail', 'track', 'trace',
  
  // People/roles (not items)
  'person', 'people', 'man', 'woman', 'guy', 'gal', 'kid', 'child',
  'guard', 'soldier', 'officer', 'cop', 'criminal', 'thief', 'bandit',
  'stranger', 'friend', 'enemy', 'ally', 'contact', 'informant',
  
  // Actions/states
  'attack', 'defense', 'move', 'movement', 'rest', 'sleep', 'wake',
  'fight', 'flight', 'run', 'walk', 'talk', 'conversation',
]);

// Common item categories that should be captured - more specific
const ITEM_KEYWORDS = [
  // Weapons
  'rifle', 'pistol', 'gun', 'revolver', 'shotgun', 'sniper', 'smg', 'carbine',
  'sword', 'knife', 'dagger', 'blade', 'axe', 'mace', 'hammer', 'spear', 'bow',
  'crossbow', 'staff', 'wand', 'katana', 'machete', 'crowbar', 'bat', 'club',
  
  // Jewelry/accessories
  'amulet', 'ring', 'necklace', 'bracelet', 'pendant', 'earring', 'brooch',
  'locket', 'charm', 'talisman', 'medallion', 'circlet', 'crown', 'tiara',
  
  // Armor/clothing
  'armor', 'shield', 'helmet', 'boots', 'gloves', 'cloak', 'robe', 'vest',
  'jacket', 'coat', 'pants', 'mask', 'goggles', 'visor', 'gauntlet',
  
  // Valuables
  'gold', 'coins', 'gem', 'jewel', 'diamond', 'ruby', 'emerald', 'sapphire',
  'pearl', 'crystal', 'ingot', 'bar', 'treasure', 'loot', 'cash', 'credits',
  
  // Documents
  'book', 'tome', 'letter', 'note', 'map', 'document', 'photograph', 'photo',
  'journal', 'diary', 'scroll', 'blueprint', 'schematic', 'manual', 'file',
  'keycard', 'passcard', 'badge', 'id', 'passport', 'license', 'permit',
  
  // Consumables
  'potion', 'elixir', 'tonic', 'serum', 'antidote', 'cure',
  'food', 'ration', 'bread', 'meat', 'fruit', 'drink', 'beverage',
  'water', 'flask', 'bottle', 'canteen', 'vial', 'syringe', 'injector',
  'medkit', 'bandage', 'medicine', 'stimpak', 'stimpack', 'healthpack',
  
  // Tools/equipment
  'torch', 'lantern', 'flashlight', 'lamp', 'candle',
  'rope', 'grapple', 'hook', 'lockpick', 'toolkit', 'wrench', 'screwdriver',
  'binoculars', 'scope', 'scanner', 'detector', 'sensor',
  'bag', 'pouch', 'backpack', 'sack', 'container', 'box', 'chest', 'crate',
  'holster', 'sheath', 'scabbard', 'quiver',
  
  // Ammo/explosives
  'ammo', 'ammunition', 'magazine', 'clip', 'rounds', 'bullets', 'shells',
  'grenade', 'explosive', 'bomb', 'mine', 'dynamite', 'c4', 'charge',
  'arrow', 'bolt', 'dart', 'cartridge',
  
  // Tech/electronics
  'radio', 'headset', 'phone', 'communicator', 'device', 'gadget', 'terminal',
  'chip', 'drive', 'disk', 'module', 'component', 'battery', 'cell',
  'implant', 'augment', 'cyberdeck', 'neural', 'interface',
  
  // Misc items
  'cigarettes', 'lighter', 'matches', 'supplies',
  'key', 'keys', 'lockbox', 'safe',
  'artifact', 'relic', 'antique', 'curio', 'trinket',
];

// Words that should NEVER be items, even if they pass other checks
const HARD_EXCLUSIONS = new Set([
  'temporary hideout', 'anonymous', 'bait', 'are high', 'you away',
  'glimmering neon', 'part of your equipment', 'your equipment',
]);

function isLikelyItem(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Hard exclusions - definitely not items
  if (HARD_EXCLUSIONS.has(lower)) return false;
  
  // Check if it starts with excluded words (sentence fragments)
  if (lower.startsWith('you ') || lower.startsWith('are ') || lower.startsWith('is ') ||
      lower.startsWith('the ') || lower.startsWith('a ') || lower.startsWith('an ') ||
      lower.startsWith('from ') || lower.startsWith('to ') || lower.startsWith('in ') ||
      lower.startsWith('with ') || lower.startsWith('by ') || lower.startsWith('for ')) {
    return false;
  }
  
  // Check if entire text is in excluded words
  if (EXCLUDED_WORDS.has(lower)) return false;
  
  // Check if it's a single common word
  const words = lower.split(/\s+/);
  if (words.length === 1 && EXCLUDED_WORDS.has(words[0])) return false;
  
  // Check if ALL words are excluded
  if (words.every(w => EXCLUDED_WORDS.has(w))) return false;
  
  // Too many words = probably a sentence fragment
  if (words.length > 4) return false;
  
  // Single words must have item keywords to be valid
  if (words.length === 1) {
    // Single word items must be recognized keywords or proper nouns with keywords
    const hasKeyword = ITEM_KEYWORDS.some(kw => lower.includes(kw));
    if (!hasKeyword) return false;
  }
  
  // Check if it contains item keywords - this is now required for 2+ word items too
  const hasKeyword = ITEM_KEYWORDS.some(kw => lower.includes(kw));
  if (hasKeyword) return true;
  
  // Only accept multi-word items that are capitalized and look like proper nouns
  // AND don't contain excluded words
  if (text.length >= 4 && text.length <= 40 && /^[A-Z]/.test(text)) {
    // Must have at least one capitalized word that isn't excluded
    const capitalWords = text.split(/\s+/).filter(w => /^[A-Z]/.test(w));
    const nonExcludedCapitals = capitalWords.filter(w => !EXCLUDED_WORDS.has(w.toLowerCase()));
    if (nonExcludedCapitals.length >= 1 && words.length <= 3) {
      // Additional check: should look like an item name, not a description
      // Item names typically don't have verbs in them
      const hasVerb = /ing$|ed$|ly$/.test(lower);
      if (!hasVerb) return true;
    }
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
      // Use fuzzy matching to handle name variations (e.g., "pistol" matches "Tank Commander Pistol")
      const matchingInventoryItem = playerInventory.find(invItem => {
        const invLower = invItem.toLowerCase();
        const parsedLower = itemLower;
        // Check if either contains the other, or if they share significant words
        if (invLower.includes(parsedLower) || parsedLower.includes(invLower)) return true;
        // Check for word-level matches (e.g., "pistol" matches "Tank Commander Pistol")
        const parsedWords = parsedLower.split(/\s+/);
        const invWords = invLower.split(/\s+/);
        return parsedWords.some(pw => pw.length >= 4 && invWords.some(iw => iw === pw || iw.includes(pw)));
      });
      
      const isInInventory = !!matchingInventoryItem;
      
      if (isInInventory && matchingInventoryItem && itemName.length >= 3) {
        // Use the ACTUAL inventory item name for accurate removal
        foundItems.add(matchingInventoryItem.toLowerCase());
        results.push({
          itemName: matchingInventoryItem, // Use the real inventory name!
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
      
      const matchingInventoryItem = playerInventory.find(invItem => {
        const invLower = invItem.toLowerCase();
        const parsedLower = itemLower;
        if (invLower.includes(parsedLower) || parsedLower.includes(invLower)) return true;
        const parsedWords = parsedLower.split(/\s+/);
        const invWords = invLower.split(/\s+/);
        return parsedWords.some(pw => pw.length >= 4 && invWords.some(iw => iw === pw || iw.includes(pw)));
      });
      
      const isInInventory = !!matchingInventoryItem;
      
      if (isInInventory && matchingInventoryItem && itemName.length >= 3) {
        foundItems.add(matchingInventoryItem.toLowerCase());
        results.push({
          itemName: matchingInventoryItem, // Use the real inventory name!
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
  
  // The parsed results already contain the correct inventory item names
  return filtered.slice(0, maxItems).map(p => p.itemName);
}
