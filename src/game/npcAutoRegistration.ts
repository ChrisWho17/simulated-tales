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
import { 
  isBlacklistedName, 
  parseNameWithTitle, 
  isHyphenatedName 
} from './npcNameGenerator';
import { isWhitelistedName, MASTER_NPC_WHITELIST } from './npcNameWhitelist';
import { 
  getRandomPersonalityForGenre,
  getPersonalityById,
  NPCPersonalityTemplate,
} from './npcPersonalityTemplates';
import {
  assignPersonalityToNPC,
  getOrAssignPersonality,
  buildNPCDialoguePrompt,
  StoredNPCPersonality,
} from './npcPersonalityDialogue';

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
  personalitiesAssigned: number;
}

// Current genre for personality assignment
let currentGenre: string = 'fantasy';

// ============= NAME DETECTION PATTERNS =============

// Common name patterns to identify potential NPCs
// Matches capitalized names, especially when preceded by action words or descriptors
const NAME_PATTERNS = [
  // Dialogue speaker pattern: "Squad Leader:" or "Captain Marcus:" at start of line or after newline
  // Also handles hyphenated names like "Neo-Kyo:"
  /(?:^|\n)\s*([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?(?:\s+[A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)*):\s*(?:\(|["']|[A-Z])/gm,
  
  // Direct mention with article: "a woman named Sarah" or "the man called John"
  // Also handles hyphenated names
  /(?:named|called|known as)\s+([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?(?:\s+[A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)?)/g,
  
  // Introduction patterns: "introduces himself as Marcus" or "introduces herself as Neo-Kyo"
  /introduces?\s+(?:himself|herself|themselves)\s+as\s+([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)/g,
  
  // Speaking attribution: 'says Sarah' or 'Sarah says' or 'Neo-Kyo says'
  /["'][^"']+["']\s*(?:says?|asks?|replies?|shouts?|whispers?|murmurs?|exclaims?)\s+([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)/g,
  /([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)\s+(?:says?|asks?|replies?|shouts?|whispers?|murmurs?|exclaims?)\s*["']/g,
  
  // Action with name: "Marcus approaches" or "Neo-Kyo waves"
  /([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)\s+(?:approaches?|greets?|waves?|nods?|smiles?|laughs?|frowns?|enters?|leaves?|stands?|sits?)/g,
  
  // Title + Name: "Captain Rodriguez", "Dr. Chen", "Cpt. Anderson"
  // Now captures the full "Title Name" for proper parsing
  /(?:Captain|Commander|Admiral|General|Lord|Lady|Sir|Dame|Dr\.?|Doctor|Professor|Chief|Elder|Master|Mistress|Cpt\.?|Cmdr\.?|Lt\.?|Col\.?|Sgt\.?|Maj\.?|Gen\.?)\s+([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?(?:\s+[A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)?)/g,
  
  // Relationship mentions: "your sister Maya" or "his brother Kael" or "her friend Neo-Kyo"
  /(?:your|his|her|their|my)\s+(?:sister|brother|mother|father|friend|ally|rival|enemy|companion|partner|spouse|wife|husband)\s+([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)/gi,
  
  // Possessive with name: "Maya's eyes" or "Neo-Kyo's sword"
  /([A-Z][a-zA-Z]+(?:-[A-Z][a-zA-Z]+)?)'s\s+(?:eyes?|voice|face|hand|sword|weapon|expression|smile|frown|words?)/g,
];

// Words that look like names but aren't (false positives to skip)
// EXPANDED: Includes common narrative words, skills, equipment, and pronouns
const FALSE_POSITIVE_NAMES = new Set([
  // Pronouns and determiners
  'The', 'This', 'That', 'Then', 'There', 'They', 'Their', 'These', 'Those',
  'You', 'Your', 'Yours', 'Yourself', 'She', 'He', 'Her', 'Him', 'It', 'Its',
  'And', 'But', 'Yet', 'Now', 'Here', 'When', 'Where', 'What', 'Who', 'Why', 'How',
  
  // Directions and time
  'North', 'South', 'East', 'West', 'Up', 'Down', 'Left', 'Right',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'Today', 'Tomorrow', 'Yesterday', 'Tonight', 'Morning', 'Evening', 'Night',
  
  // Places
  'Street', 'Avenue', 'Road', 'Boulevard', 'Lane', 'Drive', 'Place', 'Court',
  'Tower', 'Castle', 'Palace', 'Temple', 'Church', 'Cathedral', 'Shrine', 'City', 'Town', 'Village',
  'Forest', 'Mountain', 'River', 'Lake', 'Ocean', 'Sea', 'Island', 'Desert', 'Plains', 'Jungle',
  
  // Story structure
  'Chapter', 'Part', 'Section', 'Act', 'Scene', 'Story', 'Tale', 'Legend',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Last', 'Next', 'Previous',
  
  // Adjectives
  'Ancient', 'Old', 'New', 'Great', 'Grand', 'High', 'Low', 'Dark', 'Light', 'Deep',
  'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Black', 'White', 'Gray', 'Grey', 'Brown',
  'Big', 'Small', 'Tall', 'Short', 'Long', 'Wide', 'Narrow', 'Thick', 'Thin',
  
  // Pronouns
  'Something', 'Nothing', 'Everything', 'Anything', 'Someone', 'Anyone', 'Everyone', 'Nobody',
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  
  // Skills and abilities (common RPG terms)
  'Survival', 'Stealth', 'Perception', 'Athletics', 'Acrobatics', 'Combat', 'Defense',
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
  'Medicine', 'Nature', 'Arcana', 'History', 'Religion', 'Persuasion', 'Deception',
  'Intimidation', 'Investigation', 'Insight', 'Performance',
  
  // Weapons and equipment
  'Sword', 'Dagger', 'Axe', 'Mace', 'Hammer', 'Spear', 'Bow', 'Arrow', 'Shield',
  'Rifle', 'Pistol', 'Shotgun', 'Gun', 'Blade', 'Knife', 'Staff', 'Wand',
  'Armor', 'Helm', 'Helmet', 'Boots', 'Gloves', 'Cloak', 'Ring', 'Amulet',
  'Weapon', 'Item', 'Potion', 'Scroll', 'Key', 'Torch', 'Tool', 'Pack',
  
  // Common narrative words that get mistakenly tagged
  'Echo', 'Vow', 'Soul', 'Death', 'Life', 'Love', 'Hate', 'Fear', 'Hope', 'Rage', 'Fury',
  'Voice', 'Sound', 'Wind', 'Rain', 'Storm', 'Fire', 'Water', 'Earth', 'Air', 'Shadow',
  'Light', 'Darkness', 'Silence', 'Noise', 'Whisper', 'Shout', 'Scream', 'Cry',
  'Door', 'Window', 'Wall', 'Floor', 'Ceiling', 'Room', 'Chamber', 'Hall', 'Corridor',
  'Hand', 'Eye', 'Eyes', 'Face', 'Head', 'Heart', 'Mind', 'Body', 'Blood',
  
  // Verbs that might be capitalized
  'Said', 'Says', 'Asked', 'Replied', 'Answered', 'Whispered', 'Shouted', 'Murmured',
  'Walked', 'Ran', 'Stood', 'Sat', 'Lay', 'Fell', 'Rose', 'Turned', 'Looked',
  
  // Interjections
  'Well', 'Oh', 'Ah', 'Hmm', 'Huh', 'Hey', 'Wow', 'Yes', 'No', 'Maybe',
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
        
        // Clean up the name - preserve hyphens for compound names like "Neo-Kyo"
        const name = rawName.replace(/['".,!?:;]+$/, '').trim();
        
        // Skip if already seen or is a false positive
        if (seenNames.has(name.toLowerCase())) continue;
        if (FALSE_POSITIVE_NAMES.has(name)) continue;
        if (FALSE_POSITIVE_NAMES.has(name.toLowerCase())) continue; // Case-insensitive check
        if (name.length < 3) continue; // Must be at least 3 characters
        
        // Skip if name is a single common word (not a proper name)
        if (name.split(' ').length === 1 && name.length < 4) continue;
        
        // Skip standalone blacklisted terms (ranks without a following name)
        if (isBlacklistedName(name)) continue;
        
        // Parse potential title + name combinations
        const { title, name: actualName } = parseNameWithTitle(name);
        
        // Skip if the actual name is too short or is a false positive
        if (actualName.length < 3) continue;
        if (FALSE_POSITIVE_NAMES.has(actualName)) continue;
        if (FALSE_POSITIVE_NAMES.has(actualName.toLowerCase())) continue;
        
        // Determine confidence based on pattern type
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        
        // High confidence for whitelisted names (pre-approved NPC names)
        if (isWhitelistedName(actualName)) {
          confidence = 'high';
        }
        // High confidence for explicit introductions or speaking
        else if (pattern.source.includes('named') || 
            pattern.source.includes('called') ||
            pattern.source.includes('introduces')) {
          confidence = 'high';
        }
        // High confidence for titled names (Captain Anderson, Dr. Chen)
        else if (title || pattern.source.includes('Captain') || pattern.source.includes('Dr')) {
          confidence = 'high';
        }
        // High confidence for hyphenated names (clearly intentional compound names)
        else if (isHyphenatedName(actualName)) {
          confidence = 'high';
        }
        // Lower confidence for very short names (unless whitelisted)
        else if (actualName.length < 4) {
          confidence = 'low';
        }
        
        seenNames.add(actualName.toLowerCase());
        
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
          name: actualName, // Use the parsed actual name, not the full "Title Name"
          possibleOccupation: title ? `${title.toLowerCase()}` : possibleOccupation,
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
    personalitiesAssigned: 0,
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
    
    // Assign a personality based on current genre
    try {
      const personality = getRandomPersonalityForGenre(currentGenre);
      assignPersonalityToNPC(npcId, personality.id, currentGenre);
      result.personalitiesAssigned++;
      console.log(`[NPCAutoReg] Assigned personality "${personality.name}" to ${npc.name}`);
    } catch (e) {
      console.warn(`[NPCAutoReg] Failed to assign personality to ${npc.name}:`, e);
    }
    
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
      personalitiesAssigned: 0,
    };
  }
  
  console.log(`[NPCAutoReg] Detected ${detected.length} potential NPCs:`, detected.map(n => n.name));
  
  // Register the detected NPCs
  return registerDetectedNPCs(detected, currentTurn, playerName);
}

// ============= GENRE MANAGEMENT =============

/**
 * Set the current genre for personality assignment
 */
export function setNPCAutoRegistrationGenre(genre: string): void {
  currentGenre = genre.toLowerCase();
  console.log(`[NPCAutoReg] Genre set to: ${currentGenre}`);
}

/**
 * Get the current genre
 */
export function getNPCAutoRegistrationGenre(): string {
  return currentGenre;
}

// ============= CONTEXT ENRICHMENT =============

import { 
  getNPCPersonality,
  buildNPCDialoguePrompt as buildDialoguePrompt,
} from './npcPersonalityDialogue';

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
    
    // Add personality info if available
    const personality = getNPCPersonality(npc.permanent.id);
    if (personality) {
      const template = getPersonalityById(personality.personalityId);
      if (template) {
        entry += ` - ${template.name}`;
      }
    }
    
    lines.push(entry);
  }
  
  lines.push('');
  lines.push('Maintain consistency with these newly introduced characters.');
  
  return lines.join('\n');
}

/**
 * Get comprehensive personality context for all active NPCs
 * Use this for AI dialogue generation
 */
export function getAllNPCPersonalityContext(): string {
  const allNPCs = getAllRegisteredNPCs();
  if (allNPCs.length === 0) return '';
  
  const personalityContexts: string[] = [];
  
  for (const npc of allNPCs.slice(-10)) { // Last 10 NPCs max
    const personality = getNPCPersonality(npc.permanent.id);
    if (personality) {
      const dialoguePrompt = buildDialoguePrompt(
        npc.permanent.id,
        npc.permanent.name
      );
      if (dialoguePrompt) {
        personalityContexts.push(dialoguePrompt);
      }
    }
  }
  
  if (personalityContexts.length === 0) return '';
  
  return `### NPC PERSONALITY VOICE GUIDES\n\n${personalityContexts.join('\n\n---\n\n')}`;
}

/**
 * Get personality context for a specific NPC by name
 */
export function getNPCPersonalityContextByName(npcName: string): string | null {
  const npc = findNPCByName(npcName);
  if (!npc) return null;
  
  return buildDialoguePrompt(npc.permanent.id, npc.permanent.name);
}
