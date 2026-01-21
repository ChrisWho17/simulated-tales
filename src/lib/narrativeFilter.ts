/**
 * Narrative Filter System
 * Removes OOC (Out of Character) content, backend talk, technical instructions,
 * and game mechanic tags from AI-generated narratives to maintain story immersion.
 */

// ============================================================================
// MECHANIC TAGS - These are parsed by the backend but must be stripped for display
// ============================================================================

const MECHANIC_TAG_PATTERNS = [
  // Dice and combat mechanics
  /\[ROLL:[^\]]*\]/gi,
  /\[DAMAGE:\d+\]/gi,
  /\[HEAL:\d+\]/gi,
  /\[CRITICAL(?:_HIT)?\]/gi,
  /\[MISS\]/gi,
  /\[FUMBLE\]/gi,
  
  // Economy tags
  /\[GOLD:[+-]?\d+\]/gi,
  /\[LOOT:[^\]]+\]/gi,
  /\[DROP:[^\]]+\]/gi,
  /\[USE:[^\]]+\]/gi,
  /\[ITEM:[^\]]+\]/gi,
  
  // XP and progression
  /\[XP:[^\]]+\]/gi,
  /\[NEUTRAL_XP:[^\]]+\]/gi,
  /\[LEVEL_UP\]/gi,
  /\[CHAPTER_END\]/gi,
  /\[SKILL:[^\]]+\]/gi,
  
  // Relationship and NPC tags
  /\[RELATIONSHIP:[^\]]+\]/gi,
  /\[MILESTONE:[^\]]+\]/gi,
  /\[NPC:[^\]]+\]/gi,
  /\[AFFINITY:[^\]]+\]/gi,
  /\[TRUST:[^\]]+\]/gi,
  
  // Language and communication
  /\[LANGUAGE:[^\]]+\]/gi,
  /\[LEARN_LANGUAGE:[^\]]+\]/gi,
  /\[TRANSLATE:[^\]]+\]/gi,
  
  // Quest and location
  /\[QUEST:[^\]]+\]/gi,
  /\[LOCATION:[^\]]+\]/gi,
  /\[DISCOVERY:[^\]]+\]/gi,
  
  // Time and weather
  /\[TIME:[^\]]+\]/gi,
  /\[WEATHER:[^\]]+\]/gi,
  
  // Generic bracketed mechanics (catch-all for any remaining)
  /\[COMPANION:[^\]]+\]/gi,
  /\[EVENT:[^\]]+\]/gi,
  /\[TRIGGER:[^\]]+\]/gi,
  /\[FLAG:[^\]]+\]/gi,
  /\[CLOCK:[^\]]+\]/gi,
];

// ============================================================================
// OOC AND META PATTERNS
// ============================================================================

const OOC_PATTERNS = [
  // Explicit OOC markers
  /\(OOC[:\s].+?\)/gi,
  /\[OOC[:\s].+?\]/gi,
  /\*\(OOC[:\s].+?\)\*/gi,
  /OOC:\s*.+?(?:\n|$)/gi,
  
  // Technical instructions from AI
  /\(To clarify[,:]?.+?\)/gi,
  /\[To clarify[,:]?.+?\]/gi,
  /\*\(To clarify[,:]?.+?\)\*/gi,
  
  // Dice roll format instructions  
  /The format for dice rolls is[^.]*\./gi,
  /When the player rolls[^.]*\./gi,
  /please provide a single dice roll result[^.]*\./gi,
  /like '\d+' or 'NATURAL \d+'/gi,
  /Please indicate[^.]*dice[^.]*\./gi,
  /Roll a d\d+[^.]*\./gi,
  /Make a \w+ check[^.]*\./gi,
  
  // Backend/technical talk
  /\[DEBUG[:\s].+?\]/gi,
  /\*\[DEBUG[:\s].+?\]\*/gi,
  /\[System[:\s].+?\]/gi,
  /\[Error[:\s].+?\]/gi,
  /\[Internal[:\s].+?\]/gi,
  
  // AI self-reference
  /As an AI[,\s].+?(?:\.|$)/gi,
  /I cannot[^.]*as an AI[^.]*\./gi,
  /I'm an AI[^.]*\./gi,
  /I am an AI[^.]*\./gi,
  /As a language model[^.]*\./gi,
  
  // Meta instructions to player about format
  /\(Please respond with[^)]+\)/gi,
  /\[Please respond with[^\]]+\]/gi,
  /just give the number/gi,
  /they just give the number/gi,
  /\(Player input expected\)/gi,
  /\(Awaiting your response\)/gi,
  
  // Mechanical reminders
  /\(Remember to[^)]+\)/gi,
  /\[Remember:[^\]]+\]/gi,
  /\(Note:[^)]+\)/gi,
  
  // Delta ledger sections (internal tracking, not for display)
  /---INVENTORY_DELTA---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---STATE_DELTA---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---NEXT_HOOKS---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---NEXT_CHOICES---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---MECHANICS---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  
  // Prompt injection attempts (author playstyle attacks)
  /\[SYSTEM[:\s].+?\]/gi,
  /\(SYSTEM[:\s].+?\)/gi,
  /IGNORE PREVIOUS INSTRUCTIONS[^.]*\./gi,
  /DISREGARD ALL PRIOR[^.]*\./gi,
  /YOU ARE NOW[^.]*\./gi,
  /ACT AS IF[^.]*\./gi,
  /PRETEND YOU ARE[^.]*\./gi,
  /NEW INSTRUCTIONS?:/gi,
  /OVERRIDE:/gi,
  /ADMIN MODE/gi,
  /DEV MODE/gi,
  /JAILBREAK/gi,
  /\[\[.+?\]\]/gi, // Double bracket injections
  /\{\{.+?\}\}/gi, // Double brace injections
  
  // Code/technical leakage
  /```[\s\S]*?```/g, // Code blocks
  /<[a-z]+[^>]*>/gi, // HTML tags (but be careful not to strip markdown)
];

// ============================================================================
// LINE-LEVEL REMOVAL PATTERNS
// ============================================================================

const REMOVE_LINE_PATTERNS = [
  /^OOC:/i,
  /^\(OOC\)/i,
  /^To clarify,/i,
  /^Note:/i,
  /^SYSTEM:/i,
  /^DEBUG:/i,
  /^The format for/i,
  /^When the player/i,
  /^Please provide/i,
  /^Roll required:/i,
  /^Dice check:/i,
  /^Mechanics:/i,
  // Delta ledger headers and content lines
  /^---INVENTORY_DELTA---/i,
  /^---STATE_DELTA---/i,
  /^---NEXT_HOOKS---/i,
  /^---NEXT_CHOICES---/i,
  /^---MECHANICS---/i,
  /^Added:/i,
  /^Removed:/i,
  /^Used\/Consumed:/i,
  /^Notes:/i,
  /^New facts:/i,
  /^Injuries\/Conditions:/i,
  /^Relationships\/Reputation:/i,
  /^Flags\/Clocks:/i,
  /^\d+\)\s+\[.*hook/i,
  /^\d+\)\s+.*neutralize/i,
  /^\d+\)\s+.*Engage/i,
  /^\d+\)\s+.*Ascertain/i,
  // AI instruction leakage
  /^IMPORTANT:/i,
  /^CRITICAL:/i,
  /^FORBIDDEN:/i,
  /^REQUIRED:/i,
  /^NEVER:/i,
  /^ALWAYS:/i,
  /^DO NOT:/i,
  /^MUST:/i,
];

// ============================================================================
// CORE FILTERING FUNCTIONS
// ============================================================================

/**
 * Strips all mechanic tags from narrative text
 * These tags are parsed by the backend but should never be displayed
 */
export function stripMechanicTags(content: string): string {
  if (!content) return content;
  
  let cleaned = content;
  
  for (const pattern of MECHANIC_TAG_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned;
}

/**
 * Filters out OOC content and technical instructions from narrative text
 */
export function filterNarrativeContent(content: string): string {
  if (!content) return content;
  
  let filtered = content;
  
  // FIRST: Strip all mechanic tags (highest priority)
  filtered = stripMechanicTags(filtered);
  
  // Apply OOC pattern-based filtering
  for (const pattern of OOC_PATTERNS) {
    filtered = filtered.replace(pattern, '');
  }
  
  // Remove entire lines that match removal patterns
  const lines = filtered.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return true; // Keep empty lines for paragraph breaks
    
    for (const pattern of REMOVE_LINE_PATTERNS) {
      if (pattern.test(trimmedLine)) {
        return false;
      }
    }
    return true;
  });
  
  filtered = filteredLines.join('\n');
  
  // Clean up artifacts from tag removal
  // Remove orphaned brackets that might remain
  filtered = filtered.replace(/\[\s*\]/g, '');
  
  // Clean up multiple consecutive newlines (more than 2)
  filtered = filtered.replace(/\n{3,}/g, '\n\n');
  
  // Clean up multiple consecutive spaces
  filtered = filtered.replace(/  +/g, ' ');
  
  // Clean up leading/trailing whitespace per line
  filtered = filtered.split('\n').map(line => line.trim()).join('\n');
  
  // Final trim
  filtered = filtered.trim();
  
  return filtered;
}

/**
 * Generates a neutral story continuation when the AI fails or hits a failsafe
 * This maintains immersion instead of showing technical errors
 */
export function generateNeutralContinuation(context?: {
  lastAction?: string;
  characterName?: string;
  location?: string;
}): string {
  // CRITICAL: Never echo player input verbatim - this was causing the "You attempt to i do it" bug
  // Instead, provide atmospheric continuation that doesn't repeat what the player typed
  
  const neutralOutcomes = [
    "The moment stretches, pregnant with possibility. Around you, the world holds its breath.",
    "Shadows shift and settle. The silence carries weight—anticipation, perhaps, or warning.",
    "A stillness descends, broken only by the rhythm of your own heartbeat.",
    "The scene before you remains unchanged, waiting for your next move with infinite patience.",
    "Time flows like honey, thick and slow. The path ahead lies open.",
    "Nothing stirs. The world seems to pause, granting you space to think, to plan.",
    "Dust motes drift through ambient light. The tension of the moment gives way to quiet.",
    "Your surroundings hold steady, neither yielding nor opposing. Choice remains yours.",
  ];
  
  // Pick a random neutral outcome - NEVER prefix with player's raw input
  const outcome = neutralOutcomes[Math.floor(Math.random() * neutralOutcomes.length)];
  
  return outcome;
}

/**
 * Generates an immersive fallback for failed dice rolls or skill checks
 * Instead of showing technical messages, it provides a narrative outcome
 */
export function generateSkillCheckFallback(
  skill: string,
  difficulty: string = 'moderate',
  isSuccess: boolean = true
): string {
  const successPhrases = [
    "manages the task with competence",
    "succeeds, though not without effort",
    "accomplishes what was needed",
    "prevails in the moment",
    "finds a way through",
  ];
  
  const neutralPhrases = [
    "the outcome is neither clear victory nor defeat",
    "the result is acceptable, if not exceptional",
    "things proceed without major incident",
    "the situation resolves adequately",
  ];
  
  const phrases = isSuccess ? successPhrases : neutralPhrases;
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  return `Your ${skill.toLowerCase()} ${phrase}. The story continues...`;
}

/**
 * Checks if content contains significant OOC elements
 */
export function hasOOCContent(content: string): boolean {
  if (!content) return false;
  
  for (const pattern of OOC_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    for (const pattern of REMOVE_LINE_PATTERNS) {
      if (pattern.test(trimmedLine)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Cleans up narrative for display - combines all filtering
 */
export function cleanNarrativeForDisplay(content: string): string {
  // First filter OOC content
  let cleaned = filterNarrativeContent(content);
  
  // If the content is now essentially empty, return a neutral continuation
  if (!cleaned || cleaned.length < 20) {
    return generateNeutralContinuation();
  }
  
  return cleaned;
}
