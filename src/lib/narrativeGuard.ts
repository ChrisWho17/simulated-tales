/**
 * Narrative Generation Guard System
 * 
 * Prevents race conditions in AI narrative generation by:
 * 1. Ensuring all required state is ready before generation
 * 2. Detecting and rejecting echo responses
 * 3. Managing concurrent generation requests
 */

import { RPGCharacter } from '@/types/rpgCharacter';
import { WorldBible } from '@/game/worldBible/types';

// ============= TYPES =============

export interface GenerationState {
  character: RPGCharacter | null;
  worldBible: WorldBible | null;
  scenario: string | null;
  genre: string | null;
}

export interface StateValidation {
  ready: boolean;
  missing: string[];
}

// ============= GENERATION LOCK =============

let isGenerating = false;
const generationQueue: Array<{
  resolve: (value: boolean) => void;
  id: string;
}> = [];

/**
 * Acquire generation lock - prevents concurrent generation
 */
export function acquireGenerationLock(requestId: string): Promise<boolean> {
  if (!isGenerating) {
    isGenerating = true;
    console.log(`[NarrativeGuard] Lock acquired: ${requestId}`);
    return Promise.resolve(true);
  }
  
  console.log(`[NarrativeGuard] Generation in progress, queueing: ${requestId}`);
  return new Promise((resolve) => {
    generationQueue.push({ resolve, id: requestId });
  });
}

/**
 * Release generation lock - allows next queued request
 */
export function releaseGenerationLock(requestId: string): void {
  console.log(`[NarrativeGuard] Lock released: ${requestId}`);
  
  if (generationQueue.length > 0) {
    const next = generationQueue.shift()!;
    console.log(`[NarrativeGuard] Processing queued request: ${next.id}`);
    next.resolve(true);
  } else {
    isGenerating = false;
  }
}

/**
 * Cancel all queued generation requests
 */
export function cancelPendingGeneration(): void {
  console.log(`[NarrativeGuard] Cancelling ${generationQueue.length} queued requests`);
  while (generationQueue.length > 0) {
    const request = generationQueue.shift()!;
    request.resolve(false);
  }
  isGenerating = false;
}

/**
 * Check if generation is currently in progress
 */
export function isGenerationInProgress(): boolean {
  return isGenerating;
}

// ============= STATE VALIDATION =============

/**
 * Validate that all required state is ready for generation
 */
export function validateGenerationState(state: GenerationState): StateValidation {
  const missing: string[] = [];
  
  if (!state.character) {
    missing.push('character');
  } else {
    if (!state.character.name) missing.push('character.name');
    if (!state.character.stats) missing.push('character.stats');
  }
  
  if (!state.scenario) {
    missing.push('scenario');
  }
  
  if (!state.genre) {
    missing.push('genre');
  }
  
  // World Bible is optional but log if missing
  if (!state.worldBible) {
    console.log('[NarrativeGuard] WorldBible not ready (will use basic prompts)');
  } else {
    if (!state.worldBible.primaryGenre) missing.push('worldBible.primaryGenre');
  }
  
  const ready = missing.length === 0;
  
  if (!ready) {
    console.warn('[NarrativeGuard] State not ready. Missing:', missing.join(', '));
  } else {
    console.log('[NarrativeGuard] ✓ State validated for generation');
  }
  
  return { ready, missing };
}

/**
 * Wait for state to become ready (with timeout)
 */
export async function waitForStateReady(
  getState: () => GenerationState,
  timeoutMs: number = 3000,
  pollIntervalMs: number = 100
): Promise<StateValidation> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const validation = validateGenerationState(getState());
    
    if (validation.ready) {
      return validation;
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  // Final check after timeout
  const finalValidation = validateGenerationState(getState());
  
  if (!finalValidation.ready) {
    console.error('[NarrativeGuard] Timeout waiting for state. Still missing:', finalValidation.missing.join(', '));
  }
  
  return finalValidation;
}

// ============= ECHO DETECTION =============

/**
 * Detect if AI response is echoing player input (lazy/malformed response)
 * 
 * IMPORTANT: This should NOT trigger for dialogue - it's NORMAL and CORRECT for
 * the AI to include quoted player speech in the narrative. We're detecting
 * LAZY echoes like "You say: I want to help" not proper narrative handling.
 */
export function isEchoResponse(response: string, playerInput: string): boolean {
  if (!response || !playerInput) return false;
  
  const normResponse = response.toLowerCase().trim();
  const normInput = playerInput.toLowerCase().trim();
  
  // Skip if input is too short to detect meaningful echo
  if (normInput.length < 5) return false;
  
  // CRITICAL: Don't flag dialogue as echo - AI SHOULD quote what player said
  // Check if this looks like a dialogue input (question, quoted, conversational)
  const looksLikeDialogue = 
    normInput.includes('?') ||
    normInput.startsWith('"') ||
    normInput.startsWith("'") ||
    normInput.startsWith('say:') ||
    normInput.startsWith('ask:') ||
    /^(would|could|can|do|does|did|have|has|is|are|what|who|where|when|why|how)\s/i.test(normInput) ||
    /^(yes|no|yeah|sure|okay|thanks|hello|hi|hey)\b/i.test(normInput);
  
  if (looksLikeDialogue) {
    // For dialogue, only flag if the ENTIRE response is just the input echoed
    // It's fine if dialogue appears IN the narrative
    if (normResponse.length < 100) {
      // Very short response that's mostly the input - suspicious
      const inputWithoutPunc = normInput.replace(/[?.!,"']/g, '');
      if (normResponse.includes(inputWithoutPunc) && normResponse.length < inputWithoutPunc.length * 2) {
        console.warn('[NarrativeGuard] Suspiciously short dialogue echo detected');
        return true;
      }
    }
    // Otherwise, dialogue appearing in narrative is EXPECTED - not an echo
    return false;
  }
  
  // Pattern 1: "You attempt to [exact input]"
  if (normResponse.includes(`you attempt to ${normInput}`)) {
    console.warn('[NarrativeGuard] Echo detected: "you attempt to" pattern');
    return true;
  }
  
  // Pattern 2: "You try to [exact input]"
  if (normResponse.includes(`you try to ${normInput}`)) {
    console.warn('[NarrativeGuard] Echo detected: "you try to" pattern');
    return true;
  }
  
  // Pattern 3: Response starts with the input (with minor additions)
  if (normResponse.startsWith(normInput) && normInput.length > 10) {
    console.warn('[NarrativeGuard] Echo detected: starts with input');
    return true;
  }
  
  // Pattern 4: Input appears verbatim in response (for longer NON-dialogue inputs)
  // Only flag if the response is suspiciously short relative to input
  if (normInput.length > 20 && normResponse.includes(normInput)) {
    // Allow if the response is substantially longer (AI added content)
    if (normResponse.length < normInput.length * 2) {
      console.warn('[NarrativeGuard] Echo detected: verbatim inclusion with little added');
      return true;
    }
  }
  
  // Pattern 5: "You [input]." with just a period added
  if (normResponse === `you ${normInput}.` || normResponse === `you ${normInput}`) {
    console.warn('[NarrativeGuard] Echo detected: simple you + input pattern');
    return true;
  }
  
  // Pattern 6: Check for malformed prompts that leaked through
  if (normResponse.includes('you attempt to i ') || normResponse.includes('you try to i ')) {
    console.warn('[NarrativeGuard] Echo detected: malformed first-person leak');
    return true;
  }
  
  return false;
}

/**
 * Detect if input appears to be conversational/dialogue
 * These patterns suggest the player wants their character to SAY something
 */
function isConversationalInput(input: string): boolean {
  const lowered = input.toLowerCase().trim();
  
  // Question patterns (direct questions the character would ask)
  const questionPatterns = [
    /^(have|has|had|do|does|did|can|could|would|will|shall|should|is|are|was|were|what|who|where|when|why|how|which)\s/i,
    /\?$/,  // Ends with question mark
  ];
  
  // Dialogue patterns (statements that sound like speech)
  const dialoguePatterns = [
    /^(yes|no|yeah|nah|sure|okay|ok|maybe|perhaps|definitely|absolutely|never|always)/i,
    /^(thanks|thank you|please|sorry|excuse me|pardon|hello|hi|hey|goodbye|bye|farewell)/i,
    /^(i think|i believe|i feel|i want|i need|i'll|i'd|i'm|we should|we could|let's|let me)/i,
    /^(you're|you are|you look|you seem|you should|you could|you must|you need)/i,
    /^(that's|that is|this is|it's|it is|there's|there is)/i,
    /^(tell me|show me|give me|help me|explain|describe)/i,
  ];
  
  // Check question patterns
  for (const pattern of questionPatterns) {
    if (pattern.test(lowered)) return true;
  }
  
  // Check dialogue patterns
  for (const pattern of dialoguePatterns) {
    if (pattern.test(lowered)) return true;
  }
  
  // Check if input is primarily words (not action verbs like "attack", "grab", etc.)
  // and doesn't match known action patterns
  const actionVerbs = /^(attack|grab|take|push|pull|hit|kick|throw|climb|jump|run|hide|sneak|search|examine|open|close|use|look at|go to|walk to|move to)/i;
  if (!actionVerbs.test(lowered)) {
    // If it's a short phrase with no obvious action verb, it's likely dialogue
    const wordCount = lowered.split(/\s+/).length;
    if (wordCount <= 8 && !lowered.includes(' the ') && !lowered.includes(' a ')) {
      // Short phrases without articles are often conversational
      return true;
    }
  }
  
  return false;
}

/**
 * Clean player input for prompt construction
 * Removes leading "I" and normalizes for better AI understanding
 * Also detects conversational input and marks it explicitly as dialogue
 */
export function cleanPlayerInputForPrompt(input: string): string {
  let cleaned = input.trim();
  
  // First check if this appears to be conversational/dialogue
  const isDialogue = isConversationalInput(cleaned);
  
  // Remove leading "I" patterns (AI should interpret the action, not echo it)
  // But preserve for dialogue since "I think..." should stay as speech
  if (!isDialogue) {
    cleaned = cleaned.replace(/^i\s+/i, '');
  }
  
  // Keep trailing punctuation for questions - it's important context!
  // Only remove trailing periods and exclamation marks
  cleaned = cleaned.replace(/[.!]+$/, '');
  
  // If this is dialogue, wrap it to make intent crystal clear to the AI
  if (isDialogue) {
    // Check if already prefixed with a dialogue keyword
    const hasDialoguePrefix = /^(say|ask|tell|speak|shout|whisper|reply|respond|answer)\s/i.test(cleaned);
    if (!hasDialoguePrefix) {
      // Add prefix to make it clear this is SPEECH, not an action
      if (cleaned.includes('?') || /^(have|has|do|does|can|could|would|will|what|who|where|when|why|how|which)\s/i.test(cleaned)) {
        cleaned = `say: "${cleaned}"`;
      } else {
        cleaned = `say: "${cleaned}"`;
      }
    }
  }
  
  return cleaned;
}

// ============= CONTEXTUAL FALLBACK =============

const CONTEXTUAL_FALLBACKS = [
  "The moment stretches, pregnant with possibility. Something is about to change.",
  "A breath, then another. The world waits for your next move.",
  "The air shifts subtly. Whatever happens next will matter.",
  "Silence holds the space between heartbeats. The story pauses, then continues.",
  "Time slows to a crawl. Every detail becomes sharp, significant.",
  "The scene holds its breath, balanced on a knife's edge of consequence.",
];

/**
 * Get a contextual fallback when echo is detected or generation fails
 */
export function getContextualFallback(genre?: string): string {
  const base = CONTEXTUAL_FALLBACKS[Math.floor(Math.random() * CONTEXTUAL_FALLBACKS.length)];
  
  // Add genre flavor if available
  const genreFlavors: Record<string, string> = {
    fantasy: " Magic hums faintly at the edges of perception.",
    horror: " Shadows seem to lean closer, hungry for what comes next.",
    scifi: " Systems hum in the background, processing unknowable calculations.",
    mystery: " A clue waits to be noticed, hiding in plain sight.",
    noir: " The city breathes around you, indifferent to your troubles.",
    war: " Distant thunder rolls—artillery or storm, impossible to tell.",
    western: " Dust devils dance on the horizon, indifferent to human drama.",
    cyberpunk: " Neon flickers. The network pulses. Data flows eternal.",
    postapoc: " The ruins whisper of what was. What will be is unwritten.",
    cosmic_horror: " Reality bends imperceptibly. Something vast stirs in the dark between stars.",
  };
  
  if (genre && genreFlavors[genre]) {
    return base + genreFlavors[genre];
  }
  
  return base;
}

// ============= DEBUG LOGGING =============

/**
 * Log comprehensive generation debug info
 */
export function logGenerationDebug(
  playerInput: string,
  state: GenerationState,
  additionalContext?: Record<string, unknown>
): void {
  console.group('=== NARRATIVE GENERATION DEBUG ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Player Input:', playerInput);
  console.log('Player Input (cleaned):', cleanPlayerInputForPrompt(playerInput));
  console.log('Character exists:', !!state.character);
  console.log('Character name:', state.character?.name);
  console.log('WorldBible exists:', !!state.worldBible);
  console.log('WorldBible genre:', state.worldBible?.primaryGenre);
  console.log('Scenario exists:', !!state.scenario);
  console.log('Genre:', state.genre);
  console.log('Is generating:', isGenerating);
  console.log('Queue length:', generationQueue.length);
  
  if (additionalContext) {
    console.log('Additional context:', additionalContext);
  }
  
  console.groupEnd();
}
