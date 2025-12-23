// Portrait Consistency System - Maintains character visual identity across all generations
// Ensures items, clothing, and accessories overlay the base character consistently

import { CharacterData } from '@/types/characterCreation';
import { LifeSimPlayerState, ClothingItem, Outfit } from '@/types/lifeSim';

// ============= BASE CHARACTER IDENTITY =============

export interface CharacterVisualIdentity {
  // Core immutable features (from character creation)
  baseDescription: string;
  facialFeatures: string;
  bodyDescription: string;
  skinTone: string;
  eyeColor: string;
  hairColor: string;
  hairLength: string;
  hairStyle: string;
  height: string;
  bodyType: string;
  age: number;
  gender: string;
  
  // Custom details from user
  customDescription?: string;
  distinctiveFeatures: string[];
  
  // Generated reference ID for consistency
  characterSeed: string;
}

export interface PortraitContext {
  // What the character is currently wearing
  currentOutfit: OutfitDescription;
  
  // Items being held or carried
  heldItems: ItemDescription[];
  
  // Accessories and jewelry
  accessories: AccessoryDescription[];
  
  // Current state
  mood: string;
  injuries: string[];
  fatigue: boolean;
  cleanliness: 'clean' | 'dirty' | 'disheveled';
  
  // Environment context
  setting: string;
  lighting: string;
  pose: string;
}

export interface OutfitDescription {
  upperBody: string | null;
  lowerBody: string | null;
  footwear: string | null;
  headwear: string | null;
  outerwear: string | null;
  overallStyle: string;
  formality: string;
  colors: string[];
  condition: 'pristine' | 'worn' | 'damaged' | 'tattered';
}

export interface ItemDescription {
  name: string;
  type: 'weapon' | 'tool' | 'bag' | 'other';
  description: string;
  howHeld: string; // "in right hand", "slung over shoulder", etc.
}

export interface AccessoryDescription {
  name: string;
  location: string; // "around neck", "on left wrist", etc.
  description: string;
}

// ============= IDENTITY EXTRACTION =============

/**
 * Extract a stable visual identity from character creation data
 */
export function createVisualIdentity(character: CharacterData): CharacterVisualIdentity {
  const { basicInfo, appearance, personality } = character;
  
  // Generate a deterministic seed for consistency
  const seedComponents = [
    basicInfo.name,
    basicInfo.age.toString(),
    basicInfo.gender,
    appearance.bodyType,
    appearance.height,
    appearance.hairColor,
    appearance.hairLength,
    appearance.eyeColor,
    appearance.skinTone,
  ];
  const characterSeed = seedComponents.join('_').toLowerCase().replace(/\s+/g, '-');
  
  // Build base description
  const heightDesc = appearance.height === 'short' ? 'petite/short' : 
                     appearance.height === 'tall' ? 'tall' : 'average height';
  
  const buildDesc = appearance.bodyType === 'slim' ? 'slender' :
                    appearance.bodyType === 'athletic' ? 'athletically built' :
                    appearance.bodyType === 'curvy' ? 'curvaceous' :
                    appearance.bodyType === 'heavy' ? 'heavyset' : 'average build';
  
  const baseDescription = `A ${basicInfo.age}-year-old ${basicInfo.gender || 'person'}, ${heightDesc} with a ${buildDesc} physique.`;
  
  const facialFeatures = `${appearance.eyeColor} eyes, ${appearance.skinTone} skin tone, expressive features.`;
  
  const bodyDescription = `${heightDesc}, ${buildDesc}, ${appearance.skinTone} skin.`;
  
  // Extract distinctive features from custom description if provided
  const distinctiveFeatures: string[] = [];
  if (appearance.customDescription) {
    // Parse common distinctive features
    const customLower = appearance.customDescription.toLowerCase();
    if (customLower.includes('scar')) distinctiveFeatures.push('visible scar');
    if (customLower.includes('tattoo')) distinctiveFeatures.push('tattoo');
    if (customLower.includes('freckles')) distinctiveFeatures.push('freckles');
    if (customLower.includes('piercing')) distinctiveFeatures.push('piercing');
    if (customLower.includes('glasses')) distinctiveFeatures.push('glasses');
    if (customLower.includes('beard')) distinctiveFeatures.push('beard');
    if (customLower.includes('mustache')) distinctiveFeatures.push('mustache');
  }
  
  return {
    baseDescription,
    facialFeatures,
    bodyDescription,
    skinTone: appearance.skinTone,
    eyeColor: appearance.eyeColor,
    hairColor: appearance.hairColor,
    hairLength: appearance.hairLength,
    hairStyle: 'natural', // Default, can be overridden
    height: appearance.height,
    bodyType: appearance.bodyType,
    age: basicInfo.age,
    gender: basicInfo.gender || 'person',
    customDescription: appearance.customDescription,
    distinctiveFeatures,
    characterSeed,
  };
}

// ============= OUTFIT DESCRIPTION EXTRACTION =============

/**
 * Convert a LifeSim outfit to a description for portrait generation
 */
export function extractOutfitDescription(outfit: Outfit): OutfitDescription {
  const colors: string[] = [];
  let condition: 'pristine' | 'worn' | 'damaged' | 'tattered' = 'pristine';
  let worstCondition = 100;
  
  // Check each slot
  const upperBody = outfit.slots.upper_body;
  const lowerBody = outfit.slots.lower_body;
  const footwear = outfit.slots.feet;
  const headwear = outfit.slots.head;
  
  // Track condition
  const items = [upperBody, lowerBody, footwear, headwear].filter(Boolean) as ClothingItem[];
  for (const item of items) {
    if (item.condition < worstCondition) worstCondition = item.condition;
  }
  
  if (worstCondition < 30) condition = 'tattered';
  else if (worstCondition < 50) condition = 'damaged';
  else if (worstCondition < 70) condition = 'worn';
  
  // Determine formality
  const formalityScores = items.map(i => {
    switch (i.formality) {
      case 'formal': return 4;
      case 'nice': return 3;
      case 'casual': return 2;
      case 'work_specific': return 2;
      default: return 1;
    }
  });
  const avgFormality = formalityScores.reduce((a, b) => a + b, 0) / formalityScores.length;
  const formality = avgFormality >= 3.5 ? 'formal' :
                    avgFormality >= 2.5 ? 'smart casual' :
                    avgFormality >= 1.5 ? 'casual' : 'minimal';
  
  // Build style description
  let overallStyle = formality;
  if (items.some(i => i.wet)) overallStyle += ', wet';
  if (items.some(i => i.dirty)) overallStyle += ', dirty';
  
  return {
    upperBody: upperBody?.name || null,
    lowerBody: lowerBody?.name || null,
    footwear: footwear?.name || null,
    headwear: headwear?.name || null,
    outerwear: null,
    overallStyle,
    formality,
    colors,
    condition,
  };
}

/**
 * Convert inventory items to held item descriptions
 */
export function extractHeldItems(inventory: Array<{ name: string; type: string; description: string }>): ItemDescription[] {
  const heldItems: ItemDescription[] = [];
  
  // Only include weapon and notable items
  for (const item of inventory.slice(0, 2)) { // Max 2 visible items
    if (item.type === 'weapon') {
      heldItems.push({
        name: item.name,
        type: 'weapon',
        description: item.description,
        howHeld: 'at their side',
      });
    }
  }
  
  return heldItems;
}

// ============= PROMPT GENERATION =============

/**
 * Generate a consistent portrait prompt using the character identity
 */
export function generateConsistentPortraitPrompt(
  identity: CharacterVisualIdentity,
  context: PortraitContext
): string {
  const parts: string[] = [];
  
  // Core identity (always included for consistency)
  parts.push(`Generate a portrait of the SAME CHARACTER (identity: ${identity.characterSeed}):`);
  parts.push(identity.baseDescription);
  parts.push(`Physical features: ${identity.facialFeatures}`);
  parts.push(`Hair: ${identity.hairLength} ${identity.hairColor} hair.`);
  
  // Distinctive features
  if (identity.distinctiveFeatures.length > 0) {
    parts.push(`Distinctive features: ${identity.distinctiveFeatures.join(', ')}.`);
  }
  
  // Custom description
  if (identity.customDescription) {
    parts.push(`Additional details: ${identity.customDescription}`);
  }
  
  // Current outfit
  if (context.currentOutfit) {
    const outfitParts: string[] = [];
    if (context.currentOutfit.upperBody) outfitParts.push(context.currentOutfit.upperBody);
    if (context.currentOutfit.lowerBody) outfitParts.push(context.currentOutfit.lowerBody);
    if (context.currentOutfit.footwear) outfitParts.push(context.currentOutfit.footwear);
    if (context.currentOutfit.headwear) outfitParts.push(context.currentOutfit.headwear);
    
    if (outfitParts.length > 0) {
      parts.push(`Currently wearing: ${outfitParts.join(', ')}. ${context.currentOutfit.overallStyle} style.`);
    }
    
    if (context.currentOutfit.condition !== 'pristine') {
      parts.push(`Clothing appears ${context.currentOutfit.condition}.`);
    }
  }
  
  // Held items
  if (context.heldItems.length > 0) {
    const itemDescs = context.heldItems.map(i => `${i.name} ${i.howHeld}`);
    parts.push(`Carrying: ${itemDescs.join(', ')}.`);
  }
  
  // Accessories
  if (context.accessories.length > 0) {
    const accDescs = context.accessories.map(a => `${a.name} ${a.location}`);
    parts.push(`Accessories: ${accDescs.join(', ')}.`);
  }
  
  // Current state
  if (context.injuries.length > 0) {
    parts.push(`Visible injuries: ${context.injuries.join(', ')}.`);
  }
  
  if (context.fatigue) {
    parts.push('Shows signs of exhaustion.');
  }
  
  if (context.cleanliness !== 'clean') {
    parts.push(`Appears ${context.cleanliness}.`);
  }
  
  // Mood and expression
  parts.push(`Expression: ${context.mood}.`);
  
  // Setting and pose
  parts.push(`Setting: ${context.setting}. ${context.lighting} lighting.`);
  parts.push(`Pose: ${context.pose}.`);
  
  // Style instructions
  parts.push('Style: Modern contemporary realistic portrait, professional photography, present-day urban setting.');
  parts.push('CRITICAL: Maintain exact same facial features and body type as previous generations of this character.');
  parts.push('NO fantasy elements, NO historical costumes. Ultra high resolution.');
  
  return parts.join('\n');
}

/**
 * Generate portrait context from current game state
 */
export function buildPortraitContextFromState(
  lifeSimState: LifeSimPlayerState,
  inventory: Array<{ name: string; type: string; description: string }>,
  currentLocation: string,
  mood?: string
): PortraitContext {
  const outfitDesc = extractOutfitDescription(lifeSimState.outfit);
  const heldItems = extractHeldItems(inventory);
  
  // Determine injuries from body state
  const injuries = lifeSimState.body.injuries
    .filter(i => i.severity > 30)
    .map(i => `${i.severity > 60 ? 'serious' : 'visible'} injury on ${i.location}`);
  
  // Determine fatigue and cleanliness
  const fatigue = lifeSimState.needs.physical.energy < 30;
  const cleanliness = lifeSimState.body.cleanliness < 30 ? 'disheveled' :
                      lifeSimState.body.cleanliness < 60 ? 'dirty' : 'clean';
  
  // Determine mood from psychological state
  const determinedMood = mood || 
    (lifeSimState.needs.psychological.stress > 70 ? 'stressed and tense' :
     lifeSimState.needs.psychological.stress > 50 ? 'slightly worried' :
     lifeSimState.needs.psychological.stress < 30 ? 'relaxed and calm' : 'neutral');
  
  // Setting based on location
  const settingMap: Record<string, string> = {
    tavern_main: 'warm tavern interior with wooden beams',
    market: 'busy marketplace with stalls',
    town_square: 'open town square with fountain',
    alley: 'narrow urban alleyway',
    default: 'modern urban environment',
  };
  
  return {
    currentOutfit: outfitDesc,
    heldItems,
    accessories: [],
    mood: determinedMood,
    injuries,
    fatigue,
    cleanliness,
    setting: settingMap[currentLocation] || settingMap.default,
    lighting: 'natural',
    pose: 'standing, facing camera, three-quarter view',
  };
}

// ============= ITEM-SPECIFIC PORTRAITS =============

/**
 * Generate prompt for showing character with a new item
 */
export function generateItemAcquisitionPrompt(
  identity: CharacterVisualIdentity,
  baseContext: PortraitContext,
  newItem: { name: string; type: string; description: string }
): string {
  const modifiedContext = { ...baseContext };
  
  // Add the new item prominently
  modifiedContext.heldItems = [
    {
      name: newItem.name,
      type: newItem.type as any,
      description: newItem.description,
      howHeld: 'holding prominently in front of them',
    },
    ...baseContext.heldItems.slice(0, 1),
  ];
  
  modifiedContext.mood = 'examining the item with interest';
  modifiedContext.pose = 'standing, holding item up to inspect, slight smile';
  
  return generateConsistentPortraitPrompt(identity, modifiedContext);
}

/**
 * Generate prompt for showing character in new outfit
 */
export function generateOutfitChangePrompt(
  identity: CharacterVisualIdentity,
  baseContext: PortraitContext,
  newOutfit: OutfitDescription
): string {
  const modifiedContext = { ...baseContext };
  
  modifiedContext.currentOutfit = newOutfit;
  modifiedContext.mood = 'confidently showing off new outfit';
  modifiedContext.pose = 'standing tall, slight turn to show outfit';
  
  return generateConsistentPortraitPrompt(identity, modifiedContext);
}

// ============= STORAGE & RETRIEVAL =============

const IDENTITY_STORAGE_KEY = 'character-visual-identity';

export function saveVisualIdentity(identity: CharacterVisualIdentity): void {
  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
}

export function loadVisualIdentity(): CharacterVisualIdentity | null {
  const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearVisualIdentity(): void {
  localStorage.removeItem(IDENTITY_STORAGE_KEY);
}
