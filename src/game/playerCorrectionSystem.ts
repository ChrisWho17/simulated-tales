// Player Correction Command System
// Allows players to meta-correct AI mistakes using commands like "AI correct: X and Y are siblings"

import {
  findNPCByName,
  registerRelationship,
  lockRelationship,
  removeRelationship,
  lockNPCIdentity,
  getRegisteredNPC,
} from './npcIdentityRegistry';
// Note: Inventory system imports will be added when new inventory system is provided
// Stub functions for now
function findObjectByName(name: string): any { return null; }
function transferObject(...args: any[]): void {}
function getObjectOwner(id: string): any { return null; }

// ============= TYPES =============

export interface CorrectionResult {
  success: boolean;
  message: string;
  action?: string;
  details?: Record<string, any>;
}

export interface ParsedCorrection {
  type: 'relationship' | 'identity' | 'item' | 'location' | 'general';
  content: string;
  match?: RegExpMatchArray;
  raw: string;
}

export interface StoredCorrection {
  turn: number;
  correction: string;
  type: string;
  result: CorrectionResult;
  timestamp: number;
}

// ============= CORRECTION PATTERNS =============

const CORRECTION_TRIGGERS = [
  /^ai\s*(please\s*)?(correct|fix|note|remember)/i,
  /^correction:/i,
  /^note:/i,
  /^\[ooc\]/i,
  /^out of character:/i,
  /^meta:/i,
  /^actually[,:]/i,
];

const CORRECTION_HANDLERS: Record<string, RegExp> = {
  relationship: /(\w+)\s+and\s+(\w+)\s+are\s+(siblings?|married|spouses?|parent|child|not related|friends|enemies|partners)/i,
  relationshipNot: /(\w+)\s+is\s+not\s+(\w+)'s\s+(sibling|spouse|parent|child|friend)/i,
  identity: /(\w+)\s+is\s+(?:actually\s+)?(?:a\s+)?(\w+)/i,
  item: /(\w+)\s+(has|doesn't have|gave away|lost|no longer has)\s+(?:the\s+)?(.+)/i,
  itemTransfer: /(?:the\s+)?(.+)\s+(?:now\s+)?belongs?\s+to\s+(\w+)/i,
  location: /(\w+)\s+is\s+(at|in|not at|not in)\s+(.+)/i,
};

// ============= STORAGE =============

const STORAGE_KEY = 'untold-player-corrections';

let corrections: StoredCorrection[] = [];

export function loadCorrections(): StoredCorrection[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      corrections = JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Corrections] Failed to load:', e);
  }
  return corrections;
}

export function saveCorrections(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
  } catch (e) {
    console.error('[Corrections] Failed to save:', e);
  }
}

export function getCorrections(): StoredCorrection[] {
  return corrections;
}

// ============= PARSING =============

export function isPlayerCorrection(input: string): boolean {
  return CORRECTION_TRIGGERS.some(pattern => pattern.test(input.trim()));
}

export function parsePlayerCorrection(input: string): ParsedCorrection | null {
  if (!isPlayerCorrection(input)) return null;
  
  // Strip the trigger prefix
  let content = input.trim();
  for (const pattern of CORRECTION_TRIGGERS) {
    content = content.replace(pattern, '').trim();
  }
  // Also strip leading colons
  content = content.replace(/^[:;\s]+/, '').trim();
  
  // Try each handler pattern
  for (const [type, pattern] of Object.entries(CORRECTION_HANDLERS)) {
    const match = content.match(pattern);
    if (match) {
      return {
        type: type.startsWith('relationship') ? 'relationship' :
              type.startsWith('item') ? 'item' :
              type as ParsedCorrection['type'],
        content,
        match,
        raw: input,
      };
    }
  }
  
  // General catch-all
  return {
    type: 'general',
    content,
    raw: input,
  };
}

// ============= CORRECTION APPLICATION =============

export function applyPlayerCorrection(
  correction: ParsedCorrection,
  currentTurn: number = 0
): CorrectionResult {
  console.log('[Corrections] Applying:', correction);
  
  switch (correction.type) {
    case 'relationship':
      return applyRelationshipCorrection(correction, currentTurn);
    case 'item':
      return applyItemCorrection(correction, currentTurn);
    case 'location':
      return applyLocationCorrection(correction);
    case 'identity':
      return applyIdentityCorrection(correction, currentTurn);
    default:
      return applyGeneralCorrection(correction, currentTurn);
  }
}

function applyRelationshipCorrection(
  correction: ParsedCorrection,
  currentTurn: number
): CorrectionResult {
  if (!correction.match) {
    return { success: false, message: 'Could not parse relationship correction' };
  }
  
  const content = correction.content;
  
  // Check for "X is not Y's sibling" pattern
  const notMatch = content.match(CORRECTION_HANDLERS.relationshipNot);
  if (notMatch) {
    const [, name1, name2, relType] = notMatch;
    const npc1 = findNPCByName(name1);
    const npc2 = findNPCByName(name2);
    
    if (!npc1 || !npc2) {
      return { 
        success: false, 
        message: `Could not find NPC: ${!npc1 ? name1 : name2}` 
      };
    }
    
    const removed = removeRelationship(npc1.permanent.id, npc2.permanent.id);
    
    return {
      success: removed,
      message: removed 
        ? `Confirmed: ${name1} and ${name2} are NOT ${relType}s`
        : `Could not remove that relationship (it may be locked)`,
      action: 'remove_relationship',
    };
  }
  
  // Standard "X and Y are siblings" pattern
  const match = correction.match;
  const name1 = match[1];
  const name2 = match[2];
  const relationship = match[3].toLowerCase();
  
  const npc1 = findNPCByName(name1);
  const npc2 = findNPCByName(name2);
  
  if (!npc1 || !npc2) {
    return { 
      success: false, 
      message: `Could not find NPC: ${!npc1 ? name1 : ''} ${!npc2 ? name2 : ''}`.trim()
    };
  }
  
  let relType: 'sibling' | 'spouse' | 'friend' | 'enemy' = 'friend';
  
  if (relationship.includes('sibling')) {
    relType = 'sibling';
  } else if (relationship.includes('married') || relationship.includes('spouse') || relationship.includes('partner')) {
    relType = 'spouse';
  } else if (relationship.includes('friend')) {
    relType = 'friend';
  } else if (relationship.includes('enem')) {
    relType = 'enemy';
  } else if (relationship === 'not related') {
    removeRelationship(npc1.permanent.id, npc2.permanent.id);
    return {
      success: true,
      message: `Confirmed: ${name1} and ${name2} are not related`,
      action: 'remove_relationship',
    };
  }
  
  // Register and lock the relationship
  registerRelationship(npc1.permanent.id, npc2.permanent.id, relType, currentTurn);
  lockRelationship(npc1.permanent.id, npc2.permanent.id, 'player_correction');
  
  // Also lock both NPCs' identities
  lockNPCIdentity(npc1.permanent.id, 'player_correction', currentTurn);
  lockNPCIdentity(npc2.permanent.id, 'player_correction', currentTurn);
  
  return {
    success: true,
    message: `Confirmed: ${name1} and ${name2} are ${relType}s. This is now locked.`,
    action: 'set_relationship',
    details: { npc1: npc1.permanent.id, npc2: npc2.permanent.id, type: relType },
  };
}

function applyItemCorrection(
  correction: ParsedCorrection,
  currentTurn: number
): CorrectionResult {
  const content = correction.content;
  
  // Check for "X belongs to Y" pattern
  const belongsMatch = content.match(CORRECTION_HANDLERS.itemTransfer);
  if (belongsMatch) {
    const [, itemName, ownerName] = belongsMatch;
    const item = findObjectByName(itemName);
    
    if (!item) {
      return { success: false, message: `Could not find item: ${itemName}` };
    }
    
    const isPlayer = ownerName.toLowerCase() === 'player' || 
                     ownerName.toLowerCase() === 'me' ||
                     ownerName.toLowerCase() === 'i';
    
    if (isPlayer) {
      transferObject(item.id, 'player', 'player', 'player_correction', currentTurn);
      return {
        success: true,
        message: `Confirmed: You now have ${item.name}`,
        action: 'transfer_to_player',
      };
    }
    
    const npc = findNPCByName(ownerName);
    if (npc) {
      transferObject(item.id, 'npc', npc.permanent.id, 'player_correction', currentTurn);
      return {
        success: true,
        message: `Confirmed: ${npc.permanent.name} now has ${item.name}`,
        action: 'transfer_to_npc',
      };
    }
    
    return { success: false, message: `Could not find owner: ${ownerName}` };
  }
  
  // Standard "X has/doesn't have Y" pattern
  if (!correction.match) {
    return { success: false, message: 'Could not parse item correction' };
  }
  
  const match = correction.match;
  const ownerName = match[1];
  const action = match[2].toLowerCase();
  const itemName = match[3];
  
  const item = findObjectByName(itemName);
  if (!item) {
    return { success: false, message: `Could not find item: ${itemName}` };
  }
  
  const isPlayer = ownerName.toLowerCase() === 'i' || 
                   ownerName.toLowerCase() === 'player' ||
                   ownerName.toLowerCase() === 'me';
  
  if (action === 'has') {
    if (isPlayer) {
      transferObject(item.id, 'player', 'player', 'player_correction', currentTurn);
      return {
        success: true,
        message: `Confirmed: You have ${item.name}`,
        action: 'confirm_ownership',
      };
    }
    
    const npc = findNPCByName(ownerName);
    if (npc) {
      transferObject(item.id, 'npc', npc.permanent.id, 'player_correction', currentTurn);
      return {
        success: true,
        message: `Confirmed: ${npc.permanent.name} has ${item.name}`,
        action: 'confirm_ownership',
      };
    }
  } else if (action === "doesn't have" || action === 'gave away' || action === 'lost' || action === 'no longer has') {
    const currentOwner = getObjectOwner(item.id);
    const targetId = isPlayer ? 'player' : findNPCByName(ownerName)?.permanent.id;
    
    if (currentOwner && currentOwner.id === targetId) {
      // Move to limbo
      transferObject(item.id, 'location', 'limbo', 'player_correction_removed', currentTurn);
      return {
        success: true,
        message: `Confirmed: ${isPlayer ? 'You' : ownerName} no longer has ${item.name}`,
        action: 'remove_ownership',
      };
    }
    
    return {
      success: true,
      message: `Confirmed: ${isPlayer ? 'You' : ownerName} doesn't have ${item.name}`,
      action: 'confirm_no_ownership',
    };
  }
  
  return { success: false, message: 'Could not process item correction' };
}

function applyLocationCorrection(correction: ParsedCorrection): CorrectionResult {
  // Location corrections are noted but not rigidly enforced
  // The AI should respect them in narrative
  return {
    success: true,
    message: `Noted: ${correction.content}. This will be respected in the narrative.`,
    action: 'note_location',
  };
}

function applyIdentityCorrection(
  correction: ParsedCorrection,
  currentTurn: number
): CorrectionResult {
  if (!correction.match) {
    return { success: false, message: 'Could not parse identity correction' };
  }
  
  const [, npcName, identifier] = correction.match;
  const npc = findNPCByName(npcName);
  
  if (npc) {
    lockNPCIdentity(npc.permanent.id, `player_correction: is ${identifier}`, currentTurn);
    return {
      success: true,
      message: `Confirmed: ${npc.permanent.name} is ${identifier}. Identity locked.`,
      action: 'lock_identity',
    };
  }
  
  return {
    success: true,
    message: `Noted: ${npcName} is ${identifier}. Will be respected in narrative.`,
    action: 'note_identity',
  };
}

function applyGeneralCorrection(
  correction: ParsedCorrection,
  currentTurn: number
): CorrectionResult {
  // General corrections are stored and provided to AI as context
  return {
    success: true,
    message: `Noted: "${correction.content}". This will be respected going forward.`,
    action: 'general_note',
  };
}

// ============= RECORDING =============

export function recordCorrection(
  correction: ParsedCorrection,
  result: CorrectionResult,
  currentTurn: number
): void {
  corrections.push({
    turn: currentTurn,
    correction: correction.content,
    type: correction.type,
    result,
    timestamp: Date.now(),
  });
  
  // Keep last 30 corrections
  if (corrections.length > 30) {
    corrections = corrections.slice(-30);
  }
  
  saveCorrections();
}

// ============= ACKNOWLEDGMENT GENERATION =============

export function generateCorrectionAcknowledgment(
  correction: ParsedCorrection,
  result: CorrectionResult
): string {
  if (result.success) {
    return `*[${result.message}]*\n\nThe story continues with this correction applied.`;
  } else {
    return `*[I couldn't apply that correction: ${result.message}. Please try rephrasing or be more specific.]*`;
  }
}

// ============= CONTEXT BUILDER FOR AI =============

export function buildPlayerCorrectionsContext(): string {
  const recentCorrections = corrections.slice(-10);
  
  if (recentCorrections.length === 0) {
    return '';
  }
  
  const lines: string[] = [
    '## PLAYER CORRECTIONS - RESPECT THESE',
    '',
    'The player has made the following corrections. These are now CANON:',
    '',
  ];
  
  for (const corr of recentCorrections) {
    if (corr.result.success) {
      lines.push(`- ${corr.correction}`);
    }
  }
  
  lines.push('');
  lines.push('Never contradict these player corrections.');
  
  return lines.join('\n');
}

// ============= INITIALIZATION =============

loadCorrections();
