// NPC Auto-Registration System
// Automatically detects and registers NPCs from narrative responses to prevent identity drift

import {
  createRegisteredNPC,
  findNPCByName,
  lockNPCIdentity,
  registerRelationship,
  lockRelationship,
  getAllRegisteredNPCs,
  CreateNPCConfig,
} from './npcIdentityRegistry';

// ============= TYPES =============

export interface DetectedNPC {
  name: string;
  possibleOccupation?: string;
  possibleRelationships?: Array<{ name: string; type: string }>;
  context: string; // The sentence/phrase where they were detected
  confidence: 'high' | 'medium' | 'low';
}

export interface NPCRegistrationResult {
  registered: string[];
  skipped: string[];
  locked: string[];
  relationshipsCreated: number;
}

// ============= NAME DETECTION PATTERNS =============

// Common name patterns to identify potential NPCs
// Matches capitalized names, especially when preceded by action words or descriptors
const NAME_PATTERNS = [
  // Direct mention with article: "a woman named Sarah" or "the man called John"
  /(?:named|called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  
  // Introduction patterns: "introduces himself as Marcus"
  /introduces?\s+(?:himself|herself|themselves)\s+as\s+([A-Z][a-z]+)/g,
  
  // Speaking attribution: 'says Sarah' or 'Sarah says'
  /["'][^"']+["']\s*(?:says?|asks?|replies?|shouts?|whispers?|murmurs?|exclaims?)\s+([A-Z][a-z]+)/g,
  /([A-Z][a-z]+)\s+(?:says?|asks?|replies?|shouts?|whispers?|murmurs?|exclaims?)\s*["']/g,
  
  // Action with name: "Marcus approaches" or "approaches Marcus"
  /([A-Z][a-z]+)\s+(?:approaches?|greets?|waves?|nods?|smiles?|laughs?|frowns?|enters?|leaves?|stands?|sits?)/g,
  
  // Title + Name: "Captain Rodriguez", "Dr. Chen", "Lady Elara"
  /(?:Captain|Commander|Admiral|General|Lord|Lady|Sir|Dame|Dr\.?|Doctor|Professor|Chief|Elder|Master|Mistress)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  
  // Relationship mentions: "your sister Maya" or "his brother Kael"
  /(?:your|his|her|their|my)\s+(?:sister|brother|mother|father|friend|ally|rival|enemy|companion|partner|spouse|wife|husband)\s+([A-Z][a-z]+)/gi,
  
  // Possessive with name: "Maya's eyes" or "Kael's sword"
  /([A-Z][a-z]+)'s\s+(?:eyes?|voice|face|hand|sword|weapon|expression|smile|frown|words?)/g,
];

// Words that look like names but aren't (false positives to skip)
const FALSE_POSITIVE_NAMES = new Set([
  'The', 'This', 'That', 'Then', 'There', 'They', 'Their', 'These', 'Those',
  'You', 'Your', 'Yours', 'Yourself',
  'And', 'But', 'Yet', 'Now', 'Here', 'When', 'Where', 'What', 'Who', 'Why', 'How',
  'North', 'South', 'East', 'West',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'Street', 'Avenue', 'Road', 'Boulevard', 'Lane', 'Drive', 'Place', 'Court',
  'Tower', 'Castle', 'Palace', 'Temple', 'Church', 'Cathedral', 'Shrine',
  'Forest', 'Mountain', 'River', 'Lake', 'Ocean', 'Sea', 'Island',
  'Chapter', 'Part', 'Section', 'Act', 'Scene',
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Ancient', 'Old', 'New', 'Great', 'Grand', 'High', 'Low', 'Dark', 'Light',
  'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Black', 'White',
  'Something', 'Nothing', 'Everything', 'Anything', 'Someone', 'Anyone', 'Everyone',
]);

// Occupation detection patterns
const OCCUPATION_PATTERNS: Array<{ pattern: RegExp; occupation: string }> = [
  { pattern: /(?:the\s+)?(?:a\s+)?blacksmith/i, occupation: 'blacksmith' },
  { pattern: /(?:the\s+)?(?:a\s+)?merchant|trader|vendor/i, occupation: 'merchant' },
  { pattern: /(?:the\s+)?(?:a\s+)?guard|soldier|warrior|knight/i, occupation: 'guard' },
  { pattern: /(?:the\s+)?(?:a\s+)?healer|doctor|medic|nurse/i, occupation: 'healer' },
  { pattern: /(?:the\s+)?(?:a\s+)?mage|wizard|witch|sorcerer|sorceress/i, occupation: 'mage' },
  { pattern: /(?:the\s+)?(?:a\s+)?priest|priestess|cleric|monk/i, occupation: 'priest' },
  { pattern: /(?:the\s+)?(?:a\s+)?thief|rogue|assassin/i, occupation: 'thief' },
  { pattern: /(?:the\s+)?(?:a\s+)?bard|musician|performer|singer/i, occupation: 'bard' },
  { pattern: /(?:the\s+)?(?:a\s+)?innkeeper|bartender|tavern\s*(?:keeper|owner)/i, occupation: 'innkeeper' },
  { pattern: /(?:the\s+)?(?:a\s+)?captain|commander|admiral|general/i, occupation: 'military officer' },
  { pattern: /(?:the\s+)?(?:a\s+)?mayor|governor|lord|noble|king|queen|prince|princess/i, occupation: 'nobility' },
  { pattern: /(?:the\s+)?(?:a\s+)?farmer|peasant|villager/i, occupation: 'farmer' },
  { pattern: /(?:the\s+)?(?:a\s+)?scholar|professor|teacher|sage/i, occupation: 'scholar' },
  { pattern: /(?:the\s+)?(?:a\s+)?idol|celebrity|star|singer/i, occupation: 'entertainer' },
  { pattern: /(?:the\s+)?(?:a\s+)?hacker|programmer|engineer/i, occupation: 'tech specialist' },
  { pattern: /(?:the\s+)?(?:a\s+)?pilot|driver|courier/i, occupation: 'pilot' },
];

// Relationship detection patterns
const RELATIONSHIP_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /(?:your|his|her|their)\s+(?:older|younger|twin)?\s*sister/i, type: 'sibling' },
  { pattern: /(?:your|his|her|their)\s+(?:older|younger|twin)?\s*brother/i, type: 'sibling' },
  { pattern: /(?:your|his|her|their)\s+(?:step)?mother/i, type: 'parent-child' },
  { pattern: /(?:your|his|her|their)\s+(?:step)?father/i, type: 'parent-child' },
  { pattern: /(?:your|his|her|their)\s+(?:wife|husband|spouse|partner)/i, type: 'spouse' },
  { pattern: /(?:your|his|her|their)\s+friend/i, type: 'friend' },
  { pattern: /(?:your|his|her|their)\s+(?:rival|enemy|nemesis)/i, type: 'enemy' },
  { pattern: /(?:your|his|her|their)\s+(?:mentor|teacher|master)/i, type: 'colleague' },
];

// ============= DETECTION FUNCTIONS =============

export function detectNPCsInNarrative(narrative: string): DetectedNPC[] {
  const detected: DetectedNPC[] = [];
  const seenNames = new Set<string>();
  
  // Split into sentences for context extraction
  const sentences = narrative.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    // Try each pattern
    for (const pattern of NAME_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const rawName = match[1]?.trim();
        if (!rawName) continue;
        
        // Clean up the name
        const name = rawName.replace(/['".,!?:;]+$/, '').trim();
        
        // Skip if already seen or is a false positive
        if (seenNames.has(name.toLowerCase())) continue;
        if (FALSE_POSITIVE_NAMES.has(name)) continue;
        if (name.length < 2) continue;
        
        // Determine confidence based on pattern type
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        
        // High confidence for explicit introductions or speaking
        if (pattern.source.includes('named') || 
            pattern.source.includes('called') ||
            pattern.source.includes('introduces')) {
          confidence = 'high';
        }
        // High confidence for titled names
        if (pattern.source.includes('Captain') || pattern.source.includes('Dr')) {
          confidence = 'high';
        }
        
        seenNames.add(name.toLowerCase());
        
        // Try to detect occupation
        let possibleOccupation: string | undefined;
        for (const { pattern: occPattern, occupation } of OCCUPATION_PATTERNS) {
          if (occPattern.test(sentence)) {
            possibleOccupation = occupation;
            break;
          }
        }
        
        // Try to detect relationships
        const possibleRelationships: Array<{ name: string; type: string }> = [];
        for (const { pattern: relPattern, type } of RELATIONSHIP_PATTERNS) {
          if (relPattern.test(sentence)) {
            // This NPC is related to someone (player or another NPC)
            possibleRelationships.push({ name: 'player', type });
          }
        }
        
        detected.push({
          name,
          possibleOccupation,
          possibleRelationships: possibleRelationships.length > 0 ? possibleRelationships : undefined,
          context: sentence.trim().slice(0, 100),
          confidence,
        });
      }
    }
  }
  
  return detected;
}

// ============= REGISTRATION FUNCTIONS =============

export function registerDetectedNPCs(
  detected: DetectedNPC[],
  currentTurn: number = 0,
  playerName?: string
): NPCRegistrationResult {
  const result: NPCRegistrationResult = {
    registered: [],
    skipped: [],
    locked: [],
    relationshipsCreated: 0,
  };
  
  // Skip if player name is in the detected list
  const playerNameLower = playerName?.toLowerCase();
  
  for (const npc of detected) {
    // Skip if this is the player's name
    if (playerNameLower && npc.name.toLowerCase() === playerNameLower) {
      result.skipped.push(npc.name);
      continue;
    }
    
    // Check if NPC already exists
    const existing = findNPCByName(npc.name);
    if (existing) {
      result.skipped.push(npc.name);
      continue;
    }
    
    // Only auto-register high/medium confidence NPCs
    if (npc.confidence === 'low') {
      result.skipped.push(npc.name);
      continue;
    }
    
    // Create the NPC
    const config: CreateNPCConfig = {
      name: npc.name,
      occupation: npc.possibleOccupation,
      currentTurn,
    };
    
    const npcId = createRegisteredNPC(config);
    result.registered.push(npc.name);
    
    // Lock high-confidence NPCs immediately
    if (npc.confidence === 'high') {
      lockNPCIdentity(npcId, 'auto_detected_high_confidence', currentTurn);
      result.locked.push(npc.name);
    }
    
    // Register any detected relationships
    if (npc.possibleRelationships) {
      for (const rel of npc.possibleRelationships) {
        // Skip player relationships for now (would need player NPC ID)
        if (rel.name === 'player') continue;
        
        const relatedNPC = findNPCByName(rel.name);
        if (relatedNPC) {
          const relType = rel.type as 'sibling' | 'spouse' | 'friend' | 'enemy' | 'colleague';
          registerRelationship(npcId, relatedNPC.permanent.id, relType, currentTurn);
          result.relationshipsCreated++;
        }
      }
    }
    
    console.log(`[NPCAutoReg] Registered: ${npc.name}${npc.possibleOccupation ? ` (${npc.possibleOccupation})` : ''}`);
  }
  
  return result;
}

// ============= MAIN PROCESSING FUNCTION =============

export function processNarrativeForNPCs(
  narrative: string,
  currentTurn: number = 0,
  playerName?: string
): NPCRegistrationResult {
  // Detect NPCs in the narrative
  const detected = detectNPCsInNarrative(narrative);
  
  if (detected.length === 0) {
    return {
      registered: [],
      skipped: [],
      locked: [],
      relationshipsCreated: 0,
    };
  }
  
  console.log(`[NPCAutoReg] Detected ${detected.length} potential NPCs:`, detected.map(n => n.name));
  
  // Register the detected NPCs
  return registerDetectedNPCs(detected, currentTurn, playerName);
}

// ============= CONTEXT ENRICHMENT =============

// After processing, enrich NPC context for AI
export function getRecentlyRegisteredNPCContext(): string {
  const allNPCs = getAllRegisteredNPCs();
  const recentNPCs = allNPCs
    .filter(n => !n.isLocked) // Not yet fully established
    .slice(-5); // Last 5 registered
  
  if (recentNPCs.length === 0) return '';
  
  const lines: string[] = [
    '### Recently Introduced Characters:',
  ];
  
  for (const npc of recentNPCs) {
    let entry = `- ${npc.permanent.name}`;
    if (npc.semiPermanent.occupation && npc.semiPermanent.occupation !== 'none') {
      entry += ` (${npc.semiPermanent.occupation})`;
    }
    lines.push(entry);
  }
  
  lines.push('');
  lines.push('Maintain consistency with these newly introduced characters.');
  
  return lines.join('\n');
}
