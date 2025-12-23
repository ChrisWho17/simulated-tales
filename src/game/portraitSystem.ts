// Portrait Generation System - Creates consistent character portraits

import { NPC, EmotionalState } from '@/types/game';
import { ERA_PROFILES, ROLE_TO_CLOTHING, EraId, RoleId } from './eraSystem';
import { supabase } from '@/integrations/supabase/client';

export type EmotionType = 'neutral' | 'happy' | 'angry' | 'sad' | 'scared' | 'flirty' | 'suspicious';

export interface PortraitConfig {
  genre: string;
  subgenre?: string;
  era: EraId;
  emotion?: EmotionType;
}

// Art style by genre and era
const ART_STYLES: Record<string, Partial<Record<EraId, string>> & { default: string }> = {
  fantasy: {
    ancient: "classical oil painting style",
    medieval: "medieval illuminated manuscript style oil painting",
    renaissance: "renaissance master oil painting",
    steampunk: "detailed steampunk illustration",
    default: "fantasy art oil painting"
  },
  scifi: {
    nearfuture: "realistic digital concept art",
    farfuture: "sleek sci-fi digital illustration",
    cyberpunk: "neon-noir cyberpunk digital art",
    default: "sci-fi concept art"
  },
  horror: {
    ancient: "dark classical painting style",
    medieval: "dark gothic illustration",
    victorian: "gothic horror oil painting",
    modern: "photorealistic dark horror",
    default: "atmospheric horror illustration"
  },
  mystery: {
    victorian: "sherlock-era detailed illustration",
    earlymodern: "noir pulp art style",
    modern: "photorealistic noir style",
    default: "dramatic noir illustration"
  },
  western: {
    wildwest: "classic western oil painting",
    default: "western frontier art style"
  },
  cyberpunk: {
    default: "neon-noir cyberpunk digital art, high contrast"
  },
  steampunk: {
    default: "detailed steampunk illustration, brass and copper tones"
  },
  postapoc: {
    default: "gritty post-apocalyptic art, muted earth tones"
  }
};

// Emotion descriptors for portraits
const EMOTION_DESCRIPTORS: Record<EmotionType, string> = {
  neutral: 'calm neutral expression',
  happy: 'warm genuine smile',
  angry: 'fierce angry scowl',
  sad: 'melancholic sorrowful expression',
  scared: 'fearful wide-eyed expression',
  flirty: 'subtle knowing smirk, lidded eyes',
  suspicious: 'narrowed eyes, distrustful expression'
};

// Convert NPC emotional state to portrait emotion
export function emotionalStateToEmotion(state: EmotionalState): EmotionType {
  const mapping: Record<EmotionalState, EmotionType> = {
    calm: 'neutral',
    anxious: 'scared',
    angry: 'angry',
    fearful: 'scared',
    happy: 'happy',
    sad: 'sad',
    hopeful: 'happy',
    desperate: 'scared',
    numb: 'neutral',
    vigilant: 'suspicious',
    content: 'happy',
    bitter: 'angry',
    nostalgic: 'sad',
    suspicious: 'suspicious'
  };
  return mapping[state] || 'neutral';
}

// Get art style based on genre and era
function getArtStyle(genre: string, era: EraId): string {
  const genreStyles = ART_STYLES[genre.toLowerCase()];
  if (!genreStyles) return "detailed illustration";
  return genreStyles[era] || genreStyles.default;
}

// Map occupation to role
function occupationToRole(occupation: string): RoleId {
  const occupationLower = occupation.toLowerCase();
  
  if (/soldier|guard|warrior|knight|mercenary|fighter/i.test(occupationLower)) return 'soldier';
  if (/merchant|trader|shopkeeper|vendor|dealer/i.test(occupationLower)) return 'merchant';
  if (/healer|doctor|nurse|medic|physician/i.test(occupationLower)) return 'healer';
  if (/scholar|professor|researcher|scientist|mage|wizard/i.test(occupationLower)) return 'scholar';
  if (/thief|criminal|rogue|assassin|smuggler/i.test(occupationLower)) return 'criminal';
  if (/entertainer|bard|musician|performer|actor/i.test(occupationLower)) return 'entertainer';
  if (/worker|laborer|smith|craftsman|farmer/i.test(occupationLower)) return 'laborer';
  if (/noble|lord|lady|prince|king|queen/i.test(occupationLower)) return 'noble';
  if (/priest|monk|cleric|nun|religious/i.test(occupationLower)) return 'religious';
  
  return 'commoner';
}

// Get era-appropriate clothing for NPC
function getEraClothing(npc: NPC, era: EraId): string {
  const role = occupationToRole(npc.meta.occupation);
  const eraProfile = ERA_PROFILES[era];
  
  // Check role-specific clothing first
  const roleClothing = ROLE_TO_CLOTHING[role]?.[era];
  if (roleClothing) return roleClothing;
  
  // Fall back to era's common clothing
  return eraProfile.clothing.common;
}

// Build the portrait generation prompt
export function buildPortraitPrompt(
  npc: NPC,
  config: PortraitConfig
): string {
  const { genre, era, emotion = 'neutral' } = config;
  const eraProfile = ERA_PROFILES[era];
  
  const artStyle = getArtStyle(genre, era);
  const clothing = getEraClothing(npc, era);
  const emotionDesc = EMOTION_DESCRIPTORS[emotion];
  
  // Extract physical details
  const age = npc.meta.age;
  const description = npc.meta.description;
  
  // Parse gender from description (fallback to neutral)
  let gender = 'person';
  if (/\bmale\b|\bman\b|\bhe\b/i.test(description)) gender = 'man';
  if (/\bfemale\b|\bwoman\b|\bshe\b/i.test(description)) gender = 'woman';
  
  // Build the prompt
  const prompt = [
    `${artStyle} portrait of a ${age} year old ${gender}`,
    description.replace(/^A \d+-year-old .+? (man|woman|person) /, ''),
    `wearing ${clothing}`,
    emotionDesc,
    eraProfile.lighting,
    `${eraProfile.architecture} background`,
    `${era} ${genre} aesthetic`,
    'detailed face',
    'looking at viewer',
    `${eraProfile.materials} visible in scene`
  ].filter(Boolean).join(', ');
  
  return prompt;
}

// Generate portrait via edge function
export async function generateNPCPortrait(
  npc: NPC,
  config: PortraitConfig
): Promise<string | null> {
  try {
    const prompt = buildPortraitPrompt(npc, config);
    
    console.log('Generating portrait for:', npc.meta.name);
    console.log('Prompt:', prompt);
    
    const { data, error } = await supabase.functions.invoke('generate-npc-portrait', {
      body: { 
        npc: {
          id: npc.id,
          meta: npc.meta,
          emotionalState: npc.emotionalState
        },
        prompt,
        config
      }
    });
    
    if (error) {
      console.error('Portrait generation error:', error);
      return null;
    }
    
    return data?.imageUrl || null;
  } catch (err) {
    console.error('Failed to generate portrait:', err);
    return null;
  }
}

// Portrait cache management
interface PortraitCache {
  [npcId: string]: {
    [emotion in EmotionType]?: string;
  };
}

let portraitCache: PortraitCache = {};

export function getCachedPortrait(npcId: string, emotion: EmotionType = 'neutral'): string | null {
  return portraitCache[npcId]?.[emotion] || null;
}

export function setCachedPortrait(npcId: string, emotion: EmotionType, url: string): void {
  if (!portraitCache[npcId]) {
    portraitCache[npcId] = {};
  }
  portraitCache[npcId][emotion] = url;
}

export function clearPortraitCache(): void {
  portraitCache = {};
}

// Get or generate portrait
export async function getOrGeneratePortrait(
  npc: NPC,
  config: PortraitConfig
): Promise<string | null> {
  const emotion = config.emotion || emotionalStateToEmotion(npc.emotionalState.current);
  
  // Check cache first
  const cached = getCachedPortrait(npc.id, emotion);
  if (cached) return cached;
  
  // Check NPC's stored portrait
  if (npc.portrait) {
    setCachedPortrait(npc.id, emotion, npc.portrait);
    return npc.portrait;
  }
  
  // Generate new portrait
  const newPortrait = await generateNPCPortrait(npc, { ...config, emotion });
  if (newPortrait) {
    setCachedPortrait(npc.id, emotion, newPortrait);
  }
  
  return newPortrait;
}
