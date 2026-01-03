// Player Portrait Reference System
// Saves the character's visual identity from character creation as a locked reference
// Used during gameplay to regenerate portraits with environment context while maintaining consistency

import { CharacterVisualProfile } from '@/lib/characterConsistentIllustration';

// ============= STORAGE KEYS =============
const PLAYER_PORTRAIT_REFERENCE_KEY = 'player-portrait-reference';
const PLAYER_PORTRAIT_URL_KEY = 'player-portrait-url';

// ============= TYPES =============

export interface PlayerPortraitReference {
  // Core identity from character creation
  name: string;
  gender: string;
  build: string;
  height: string;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  role: string;
  details: string[];
  customDescription?: string;
  
  // Genre context for style matching
  genre: string;
  className?: string;
  
  // Full appearance description for AI
  fullVisualDescription: string;
  
  // Tiered appearance data for full reconstruction
  tieredAppearance?: any;
  
  // Portrait hints from class
  portraitHints?: string[];
  
  // Created timestamp
  createdAt: number;
}

// ============= SAVE & LOAD =============

/**
 * Save the player's portrait reference from character creation
 * This becomes the locked reference for all future portrait generations
 */
export function savePlayerPortraitReference(
  characterData: {
    name: string;
    gender?: string;
    build?: string;
    height?: string;
    skinTone?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    role?: string;
    details?: string[];
    customDescription?: string;
    tieredAppearance?: any;
    appearanceDescription?: string;
  },
  genre: string,
  className?: string,
  portraitHints?: string[]
): void {
  const reference: PlayerPortraitReference = {
    name: characterData.name,
    gender: characterData.gender || 'male',
    build: characterData.build || 'average',
    height: characterData.height || 'average',
    skinTone: characterData.skinTone || 'medium',
    hairColor: characterData.hairColor || 'brown',
    hairStyle: characterData.hairStyle || 'short',
    eyeColor: characterData.eyeColor || 'brown',
    role: characterData.role || className || 'adventurer',
    details: characterData.details || [],
    customDescription: characterData.customDescription,
    genre,
    className,
    fullVisualDescription: characterData.appearanceDescription || buildFullDescription(characterData),
    tieredAppearance: characterData.tieredAppearance,
    portraitHints,
    createdAt: Date.now(),
  };
  
  try {
    localStorage.setItem(PLAYER_PORTRAIT_REFERENCE_KEY, JSON.stringify(reference));
    console.log('[PlayerPortrait] Saved portrait reference for:', characterData.name);
  } catch (error) {
    console.error('[PlayerPortrait] Failed to save reference:', error);
  }
}

/**
 * Load the player's locked portrait reference
 */
export function loadPlayerPortraitReference(): PlayerPortraitReference | null {
  try {
    const stored = localStorage.getItem(PLAYER_PORTRAIT_REFERENCE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('[PlayerPortrait] Failed to load reference:', error);
    return null;
  }
}

/**
 * Clear the portrait reference (on new game or clear data)
 */
export function clearPlayerPortraitReference(): void {
  localStorage.removeItem(PLAYER_PORTRAIT_REFERENCE_KEY);
  localStorage.removeItem(PLAYER_PORTRAIT_URL_KEY);
}

/**
 * Save the current portrait URL
 */
export function savePlayerPortraitUrl(url: string): void {
  try {
    localStorage.setItem(PLAYER_PORTRAIT_URL_KEY, url);
  } catch (error) {
    console.error('[PlayerPortrait] Failed to save portrait URL:', error);
  }
}

/**
 * Load the current portrait URL
 */
export function loadPlayerPortraitUrl(): string | null {
  try {
    return localStorage.getItem(PLAYER_PORTRAIT_URL_KEY);
  } catch (error) {
    return null;
  }
}

// ============= PROMPT BUILDING =============

function buildFullDescription(data: {
  gender?: string;
  build?: string;
  height?: string;
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  details?: string[];
}): string {
  const parts = [];
  
  if (data.gender) parts.push(data.gender === 'female' ? 'woman' : data.gender === 'male' ? 'man' : 'person');
  if (data.build) parts.push(`${data.build} build`);
  if (data.height) parts.push(`${data.height} height`);
  if (data.skinTone) parts.push(`${data.skinTone} skin`);
  if (data.hairColor && data.hairStyle) parts.push(`${data.hairColor} ${data.hairStyle} hair`);
  if (data.eyeColor) parts.push(`${data.eyeColor} eyes`);
  if (data.details && data.details.length > 0) parts.push(data.details.join(', '));
  
  return parts.join(', ');
}

/**
 * Build a portrait prompt using the locked reference + environment context
 * This ensures character consistency while adapting to current scene
 */
export function buildGameplayPortraitPrompt(
  reference: PlayerPortraitReference,
  environmentContext?: {
    location?: string;
    weather?: string;
    timeOfDay?: string;
    mood?: string;
    currentAction?: string;
    isInCombat?: boolean;
  }
): string {
  const parts: string[] = [];
  
  // Core character identity (locked from creation)
  parts.push('masterpiece, best quality, ultra detailed digital painting');
  parts.push('realistic style, cinematic lighting, dramatic atmosphere');
  parts.push('three-quarter body shot from knees up');
  parts.push('highly detailed face and eyes');
  
  // Character description from locked reference
  const genderDesc = reference.gender === 'female' ? 'woman' : reference.gender === 'male' ? 'man' : 'person';
  parts.push(`${genderDesc} with ${reference.build} build`);
  parts.push(`${reference.skinTone} skin, ${reference.hairColor} ${reference.hairStyle} hair, ${reference.eyeColor} eyes`);
  
  if (reference.details.length > 0) {
    parts.push(reference.details.join(', '));
  }
  
  // Role-based appearance
  parts.push(`${reference.className || reference.role} appearance and gear`);
  
  // Portrait hints from class
  if (reference.portraitHints && reference.portraitHints.length > 0) {
    parts.push(reference.portraitHints.join(', '));
  }
  
  // Environment context (variable based on current scene)
  if (environmentContext) {
    if (environmentContext.currentAction) {
      parts.push(environmentContext.currentAction);
    }
    
    if (environmentContext.mood) {
      const moodExpressions: Record<string, string> = {
        happy: 'joyful expression, warm smile',
        sad: 'melancholic expression, sorrowful eyes',
        angry: 'fierce expression, intense glare',
        fearful: 'worried expression, tense posture',
        neutral: 'calm composed expression',
        determined: 'determined expression, focused gaze',
        wounded: 'pained expression, visible fatigue',
      };
      parts.push(moodExpressions[environmentContext.mood] || 'neutral expression');
    }
    
    if (environmentContext.isInCombat) {
      parts.push('combat ready stance, intense battle atmosphere');
    }
    
    // Environment background
    const bgParts: string[] = [];
    if (environmentContext.location) {
      bgParts.push(environmentContext.location);
    }
    if (environmentContext.weather) {
      bgParts.push(environmentContext.weather);
    }
    if (environmentContext.timeOfDay) {
      bgParts.push(`${environmentContext.timeOfDay} lighting`);
    }
    
    if (bgParts.length > 0) {
      parts.push(`background: ${bgParts.join(', ')}`);
    }
  }
  
  // Genre style
  const genreStyles: Record<string, string> = {
    fantasy: 'high fantasy art style, magical atmosphere',
    scifi: 'sci-fi aesthetic, futuristic elements',
    cyberpunk: 'neon-noir cyberpunk style, high contrast',
    postapoc: 'post-apocalyptic wasteland aesthetic',
    horror: 'dark atmospheric horror style',
    western: 'wild west frontier aesthetic',
    war: 'military combat art style',
    noir: 'film noir detective aesthetic',
    pirate: 'golden age of piracy style',
    steampunk: 'victorian steampunk aesthetic',
    modern: 'modern contemporary style',
  };
  
  parts.push(genreStyles[reference.genre] || 'detailed illustration');
  
  // Consistency instruction
  parts.push('CRITICAL: Maintain exact same facial features, body type, and distinctive marks as character reference');
  
  return parts.join(', ');
}

/**
 * Check if a portrait reference exists (character has been created)
 */
export function hasPlayerPortraitReference(): boolean {
  return localStorage.getItem(PLAYER_PORTRAIT_REFERENCE_KEY) !== null;
}
