// FLUX.1 Portrait Generation - Secure server-side implementation via edge function
import { supabase } from '@/integrations/supabase/client';

// Detected clothing item from portrait analysis
export interface DetectedClothingItem {
  item: string;
  slot: 'torso' | 'legs' | 'feet' | 'head' | 'hands' | 'accessory' | 'outfit';
  genre?: string[];
  tags: string[];
}

// Detected keywords response from portrait generation
export interface DetectedKeywords {
  personalityScore: number;
  keywords: { category: string; keyword: string; effect: string }[];
  colorMods: string[];
  patternMods: string[];
  physiqueMods: string[];
  clothFitMods: string[];
  clothingItems?: DetectedClothingItem[];
  genre?: string;
}

// Portrait generation result
export interface PortraitResult {
  imageUrl: string;
  detectedKeywords?: DetectedKeywords;
}

// Character data interface for portrait generation
export interface PortraitCharacterData {
  name?: string;
  gender?: string;
  age?: number | string;
  build?: string;
  height?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  skinTone?: string;
  faceShape?: string;
  distinguishingFeatures?: string[];
  accessories?: string[];
  details?: string[];
  // Body shape details
  bustSize?: string;
  hipWidth?: string;
  muscleDefinition?: string;
  bodyHair?: string;
  // Body modifications
  piercings?: string[];
  tattoos?: string[];
  tattooStyle?: string;
  scars?: string[];
  prosthetics?: string[];
  implants?: string[];
  mutations?: string[];
  clothingStyle?: string;
  clothingDetails?: string[];
  // Class/role info
  characterClass?: string;
  portraitHints?: string[];
  // Additional details with keywords
  additionalDetails?: string;
  // Environment context for scene adaptation
  environmentContext?: {
    location?: string;
    weather?: string;
    timeOfDay?: string;
    mood?: string;
    isInCombat?: boolean;
  };
}

// Legacy function - takes just a prompt string (for backward compatibility)
export async function generatePortraitWithFlux(prompt: string): Promise<string> {
  console.log('[Portrait] Calling edge function with prompt only (legacy mode):', prompt.substring(0, 100) + '...');
  
  const { data, error } = await supabase.functions.invoke('generate-portrait', {
    body: {
      customPrompt: prompt,
    }
  });

  if (error) {
    console.error('[Portrait] Edge function error:', error);
    throw new Error(`Portrait generation failed: ${error.message}`);
  }

  if (!data?.imageUrl) {
    console.error('[Portrait] No image URL in response:', data);
    throw new Error('No image generated');
  }

  console.log('[Portrait] Successfully generated portrait');
  return data.imageUrl;
}

// Full character data function - passes structured data for accurate body modifications
// Returns both image URL and detected keywords for UI feedback
export async function generatePortraitWithCharacterData(
  characterData: PortraitCharacterData,
  genre: string = 'modern'
): Promise<PortraitResult> {
  console.log('[Portrait] Calling edge function with full character data:', {
    name: characterData.name,
    gender: characterData.gender,
    piercings: characterData.piercings?.length,
    tattoos: characterData.tattoos?.length,
    scars: characterData.scars?.length,
    implants: characterData.implants?.length,
    prosthetics: characterData.prosthetics?.length,
    mutations: characterData.mutations?.length,
    clothingStyle: characterData.clothingStyle,
    additionalDetails: characterData.additionalDetails?.substring(0, 50),
  });
  
  const { data, error } = await supabase.functions.invoke('generate-portrait', {
    body: {
      name: characterData.name || 'Character',
      gender: characterData.gender || 'male',
      age: characterData.age,
      build: characterData.build || 'average',
      height: characterData.height || 'average',
      hairColor: characterData.hairColor || 'brown',
      hairStyle: characterData.hairStyle || 'short',
      eyeColor: characterData.eyeColor || 'brown',
      skinTone: characterData.skinTone || 'medium',
      faceShape: characterData.faceShape,
      details: characterData.details || [],
      distinguishingFeatures: characterData.distinguishingFeatures || [],
      accessories: characterData.accessories || [],
      // Body shape details
      bustSize: characterData.bustSize,
      hipWidth: characterData.hipWidth,
      muscleDefinition: characterData.muscleDefinition,
      bodyHair: characterData.bodyHair,
      // Critical body modifications - passed explicitly
      piercings: characterData.piercings || [],
      tattoos: characterData.tattoos || [],
      tattooStyle: characterData.tattooStyle,
      scars: characterData.scars || [],
      prosthetics: characterData.prosthetics || [],
      implants: characterData.implants || [],
      mutations: characterData.mutations || [],
      clothingStyle: characterData.clothingStyle,
      clothingDetails: characterData.clothingDetails || [],
      // Additional details with keywords
      additionalDetails: characterData.additionalDetails || '',
      // Class/role info
      characterClass: characterData.characterClass,
      portraitHints: characterData.portraitHints || [],
      // Environment context
      environmentContext: characterData.environmentContext,
      // Genre for styling
      genre: genre,
    }
  });

  if (error) {
    console.error('[Portrait] Edge function error:', error);
    throw new Error(`Portrait generation failed: ${error.message}`);
  }

  if (!data?.imageUrl) {
    console.error('[Portrait] No image URL in response:', data);
    throw new Error('No image generated');
  }

  console.log('[Portrait] Successfully generated portrait with body modifications');
  console.log('[Portrait] Detected keywords:', data.detectedKeywords);
  
  return {
    imageUrl: data.imageUrl,
    detectedKeywords: data.detectedKeywords,
  };
}
