/**
 * Narrative Filter System
 * Removes OOC (Out of Character) content, backend talk, and technical instructions
 * from AI-generated narratives to maintain story immersion.
 */

// Patterns that indicate OOC or meta content
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
  
  // Backend/technical talk
  /\[DEBUG[:\s].+?\]/gi,
  /\*\[DEBUG[:\s].+?\]\*/gi,
  /\[System[:\s].+?\]/gi,
  /\[Error[:\s].+?\]/gi,
  
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
  
  // Mechanical reminders
  /\(Remember to[^)]+\)/gi,
  /\[Remember:[^\]]+\]/gi,
  
  // Delta ledger sections (internal tracking, not for display)
  /---INVENTORY_DELTA---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---STATE_DELTA---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---NEXT_HOOKS---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  /---NEXT_CHOICES---[\s\S]*?(?=---[A-Z_]+---|$)/gi,
  
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

// Patterns for lines that should be completely removed
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
  // Delta ledger headers and content lines
  /^---INVENTORY_DELTA---/i,
  /^---STATE_DELTA---/i,
  /^---NEXT_HOOKS---/i,
  /^---NEXT_CHOICES---/i,
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
];

/**
 * Filters out OOC content and technical instructions from narrative text
 */
export function filterNarrativeContent(content: string): string {
  if (!content) return content;
  
  let filtered = content;
  
  // Apply pattern-based filtering
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
  
  // Clean up multiple consecutive newlines (more than 2)
  filtered = filtered.replace(/\n{3,}/g, '\n\n');
  
  // Clean up leading/trailing whitespace
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
