// Portrait Generation System - Creates consistent character portraits
// with lazy loading, CSS fallbacks, caching, and emotion variants

import { NPC, EmotionalState } from '@/types/game';
import { ERA_PROFILES, ROLE_TO_CLOTHING, EraId, RoleId } from './eraSystem';
import { supabase } from '@/integrations/supabase/client';

// ============= EMOTION TYPES =============

export type EmotionType = 
  | 'neutral' | 'happy' | 'angry' | 'sad' | 'fearful' 
  | 'surprised' | 'disgusted' | 'flirty' | 'suspicious' 
  | 'hurt' | 'smug' | 'thoughtful';

export interface PortraitConfig {
  genre: string;
  subgenre?: string;
  era: EraId;
  emotion?: EmotionType;
}

// ============= PORTRAIT DATA STRUCTURES =============

export interface PortraitVariant {
  url: string;
  generated: number;
}

export interface NPCPortraitData {
  characterSeed: string;
  baseDescription: string;
  artStyle: string;
  variants: Partial<Record<EmotionType, PortraitVariant>>;
  currentEmotion: EmotionType;
  isTransitioning: boolean;
  pendingGeneration: EmotionType | null;
  generationQueue: EmotionType[];
}

export interface PortraitResult {
  url: string;
  fallbackEmotion?: EmotionType;
  useCSSFallback: boolean;
  isGenerating?: boolean;
}

// ============= EMOTION MAPPINGS =============

// Map game emotional states to portrait variants
export const EMOTION_TO_PORTRAIT: Record<string, EmotionType> = {
  // Primary emotions
  joy: 'happy',
  anger: 'angry',
  sadness: 'sad',
  fear: 'fearful',
  surprise: 'surprised',
  disgust: 'disgusted',
  
  // Complex states map to closest variant
  irritated: 'angry',
  furious: 'angry',
  anxious: 'fearful',
  terrified: 'fearful',
  melancholic: 'sad',
  grieving: 'sad',
  hopeful: 'happy',
  grateful: 'happy',
  happy: 'happy',
  attracted: 'flirty',
  aroused: 'flirty',
  distrustful: 'suspicious',
  wary: 'suspicious',
  contempt: 'disgusted',
  betrayed: 'hurt',
  disappointed: 'hurt',
  proud: 'smug',
  confident: 'smug',
  curious: 'thoughtful',
  confused: 'thoughtful',
  
  // Direct mappings
  neutral: 'neutral',
  calm: 'neutral',
  vigilant: 'suspicious',
  content: 'happy',
  bitter: 'angry',
  nostalgic: 'sad',
  desperate: 'fearful',
  numb: 'neutral',
  suspicious: 'suspicious',
  angry: 'angry',
  fearful: 'fearful',
  sad: 'sad'
};

// Priority for generation (lower = higher priority)
const EMOTION_PRIORITY: Record<EmotionType, number> = {
  neutral: 0,
  happy: 1,
  angry: 2,
  sad: 3,
  suspicious: 4,
  fearful: 5,
  flirty: 6,
  surprised: 7,
  hurt: 8,
  smug: 9,
  thoughtful: 10,
  disgusted: 11
};

// ============= EMOTION DESCRIPTORS =============

export const EMOTION_DESCRIPTORS: Record<EmotionType, string> = {
  neutral: 'calm neutral expression, relaxed face, composed demeanor',
  happy: 'warm genuine smile, bright eyes, friendly expression, slight laugh lines',
  angry: 'fierce scowl, furrowed brow, intense glaring eyes, clenched jaw, tense expression',
  sad: 'sorrowful expression, downcast eyes, slight frown, melancholic gaze, weary look',
  fearful: 'wide fearful eyes, raised eyebrows, tense expression, pale complexion, worried look',
  surprised: 'raised eyebrows, wide eyes, slightly open mouth, shocked expression',
  disgusted: 'curled lip, narrowed eyes, wrinkled nose, disapproving expression',
  flirty: 'subtle knowing smirk, half-lidded eyes, slight head tilt, playful expression',
  suspicious: 'narrowed watchful eyes, slight frown, guarded expression, skeptical look',
  hurt: 'pained expression, glistening eyes, vulnerable look, wounded expression',
  smug: 'self-satisfied smirk, raised eyebrow, confident expression, knowing look',
  thoughtful: 'contemplative gaze, distant eyes, slight furrow, pensive expression'
};

// ============= ART STYLES =============

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
  },
  war: {
    default: "dramatic military portrait, realistic oil painting style"
  },
  pirate: {
    default: "golden age of piracy illustration, nautical adventure art"
  },
  modern_life: {
    default: "contemporary lifestyle photography style, warm natural lighting, modern portrait"
  }
};

// ============= CONVERSION FUNCTIONS =============

export function emotionalStateToEmotion(state: EmotionalState): EmotionType {
  return EMOTION_TO_PORTRAIT[state] || 'neutral';
}

function getArtStyle(genre: string, era: EraId): string {
  const genreStyles = ART_STYLES[genre.toLowerCase()];
  if (!genreStyles) return "detailed illustration";
  return genreStyles[era] || genreStyles.default;
}

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

function getEraClothing(npc: NPC, era: EraId): string {
  const role = occupationToRole(npc.meta.occupation);
  const eraProfile = ERA_PROFILES[era];
  
  const roleClothing = ROLE_TO_CLOTHING[role]?.[era];
  if (roleClothing) return roleClothing;
  
  return eraProfile.clothing.common;
}

// ============= CONSISTENT PROMPT BUILDING =============

export function buildConsistentPrompt(
  npc: NPC,
  emotion: EmotionType,
  genre: string,
  era: EraId,
  baseDescription?: string
): string {
  const eraProfile = ERA_PROFILES[era];
  const artStyle = getArtStyle(genre, era);
  const clothing = getEraClothing(npc, era);
  const emotionDesc = EMOTION_DESCRIPTORS[emotion];
  
  // Extract physical details
  const age = npc.meta.age;
  const description = baseDescription || npc.meta.description;
  
  // Parse gender from description
  let gender = 'person';
  if (/\bmale\b|\bman\b|\bhe\b/i.test(description)) gender = 'man';
  if (/\bfemale\b|\bwoman\b|\bshe\b/i.test(description)) gender = 'woman';
  
  // Clean description (remove redundant age/gender prefix)
  const cleanedDesc = description.replace(/^A \d+-year-old .+? (man|woman|person) /, '');
  
  // Build the prompt with consistent structure
  const prompt = [
    `${artStyle} portrait, head and shoulders, facing viewer, centered composition`,
    `${age} year old ${gender}`,
    cleanedDesc,
    emotionDesc,
    `wearing ${clothing}`,
    eraProfile.lighting,
    `${eraProfile.architecture} background, slightly blurred`,
    `${era} ${genre} aesthetic`,
    'highly detailed face',
    'looking at viewer',
    'consistent character'
  ].filter(Boolean).join(', ');
  
  return prompt;
}

// ============= GENERATION QUEUE =============

interface QueueItem {
  key: string;
  npcId: string;
  emotion: EmotionType;
  genre: string;
  era: EraId;
  priority: number;
  baseDescription?: string;
}

const generationQueue: QueueItem[] = [];
let isProcessingQueue = false;
const eventListeners: Map<string, Set<(event: { npcId: string; emotion: EmotionType; url: string }) => void>> = new Map();

export function subscribeToPortraitGeneration(
  callback: (event: { npcId: string; emotion: EmotionType; url: string }) => void
): () => void {
  const id = Math.random().toString(36).slice(2);
  if (!eventListeners.has('portraitGenerated')) {
    eventListeners.set('portraitGenerated', new Set());
  }
  eventListeners.get('portraitGenerated')!.add(callback);
  
  return () => {
    eventListeners.get('portraitGenerated')?.delete(callback);
  };
}

function emitPortraitGenerated(npcId: string, emotion: EmotionType, url: string) {
  eventListeners.get('portraitGenerated')?.forEach(callback => {
    callback({ npcId, emotion, url });
  });
}

export function queuePortraitGeneration(
  npcId: string,
  emotion: EmotionType,
  genre: string,
  era: EraId,
  baseDescription?: string
) {
  const queueKey = `${npcId}-${emotion}`;
  if (generationQueue.some(item => item.key === queueKey)) return;
  
  generationQueue.push({
    key: queueKey,
    npcId,
    emotion,
    genre,
    era,
    priority: EMOTION_PRIORITY[emotion],
    baseDescription
  });
  
  // Sort by priority (common emotions first)
  generationQueue.sort((a, b) => a.priority - b.priority);
  
  processGenerationQueue();
}

async function processGenerationQueue() {
  if (isProcessingQueue || generationQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (generationQueue.length > 0) {
    const item = generationQueue.shift()!;
    
    try {
      const url = await generatePortraitVariantDirect(
        item.npcId,
        item.emotion,
        item.genre,
        item.era,
        item.baseDescription
      );
      
      if (url) {
        emitPortraitGenerated(item.npcId, item.emotion, url);
      }
      
      // Small delay between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Failed to generate ${item.emotion} portrait for NPC ${item.npcId}`, error);
    }
  }
  
  isProcessingQueue = false;
}

// ============= DIRECT GENERATION =============

async function generatePortraitVariantDirect(
  npcId: string,
  emotion: EmotionType,
  genre: string,
  era: EraId,
  baseDescription?: string
): Promise<string | null> {
  try {
    // Build a minimal NPC object for the edge function
    const npcData = {
      id: npcId,
      meta: {
        name: npcId,
        age: 30,
        occupation: 'adventurer',
        description: baseDescription || 'A mysterious figure'
      }
    };
    
    const prompt = buildConsistentPrompt(npcData as NPC, emotion, genre, era, baseDescription);
    
    console.log(`Generating ${emotion} portrait for NPC ${npcId}`);
    
    const { data, error } = await supabase.functions.invoke('generate-npc-portrait', {
      body: { 
        npc: npcData,
        prompt,
        config: { genre, era, emotion }
      }
    });
    
    if (error) {
      console.error('Portrait generation error:', error);
      return null;
    }
    
    const url = data?.imageUrl;
    if (url) {
      setCachedPortrait(npcId, emotion, url);
    }
    
    return url || null;
  } catch (err) {
    console.error('Failed to generate portrait:', err);
    return null;
  }
}

// ============= LAZY LOADING PORTRAIT RETRIEVAL =============

export async function getPortraitForEmotion(
  npc: NPC,
  targetEmotion: EmotionalState | EmotionType,
  genre: string,
  era: EraId
): Promise<PortraitResult> {
  const portraitKey = EMOTION_TO_PORTRAIT[targetEmotion] || (targetEmotion as EmotionType) || 'neutral';
  
  // 1. Check if we already have this variant cached
  const cached = getCachedPortrait(npc.id, portraitKey);
  if (cached) {
    return { url: cached, useCSSFallback: false };
  }
  
  // 2. Check NPC's existing portrait
  if (npc.portrait) {
    setCachedPortrait(npc.id, 'neutral', npc.portrait);
  }
  
  // 3. Check if neutral exists (always need this first)
  const neutralCached = getCachedPortrait(npc.id, 'neutral');
  
  if (!neutralCached && !npc.portrait) {
    // Generate neutral first
    const neutralUrl = await generateNPCPortrait(npc, { genre, era, emotion: 'neutral' });
    if (neutralUrl) {
      setCachedPortrait(npc.id, 'neutral', neutralUrl);
      
      if (portraitKey === 'neutral') {
        return { url: neutralUrl, useCSSFallback: false };
      }
    }
  }
  
  // 4. If requesting non-neutral and don't have it, use fallback while queueing
  if (portraitKey !== 'neutral') {
    const baseUrl = neutralCached || npc.portrait || getCachedPortrait(npc.id, 'neutral');
    
    if (baseUrl) {
      // Queue background generation
      queuePortraitGeneration(npc.id, portraitKey, genre, era, npc.meta.description);
      
      return {
        url: baseUrl,
        fallbackEmotion: portraitKey,
        useCSSFallback: true,
        isGenerating: true
      };
    }
  }
  
  // 5. Return neutral if available
  const finalNeutral = getCachedPortrait(npc.id, 'neutral') || npc.portrait;
  if (finalNeutral) {
    return { url: finalNeutral, useCSSFallback: portraitKey !== 'neutral', fallbackEmotion: portraitKey };
  }
  
  // 6. No portrait available
  return { url: '', useCSSFallback: false };
}

// ============= PORTRAIT GENERATION =============

export async function generateNPCPortrait(
  npc: NPC,
  config: PortraitConfig
): Promise<string | null> {
  const emotion = config.emotion || 'neutral';
  
  // Check cache first
  const cached = getCachedPortrait(npc.id, emotion);
  if (cached) return cached;
  
  try {
    const prompt = buildConsistentPrompt(npc, emotion, config.genre, config.era);
    
    console.log('Generating portrait for:', npc.meta.name);
    
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
    
    const url = data?.imageUrl;
    if (url) {
      setCachedPortrait(npc.id, emotion, url);
    }
    
    return url || null;
  } catch (err) {
    console.error('Failed to generate portrait:', err);
    return null;
  }
}

// ============= CACHE MANAGEMENT =============

interface PortraitCacheEntry {
  [emotion: string]: {
    url: string;
    timestamp: number;
  };
}

interface PortraitCache {
  [npcId: string]: PortraitCacheEntry;
}

const STORAGE_KEY = 'npc_portrait_cache';
let memoryCache: PortraitCache = {};
let cacheLoaded = false;

function loadCacheFromStorage() {
  if (cacheLoaded) return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      memoryCache = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load portrait cache:', e);
  }
  
  cacheLoaded = true;
}

function saveCacheToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (e) {
    console.warn('Failed to save portrait cache:', e);
  }
}

export function getCachedPortrait(npcId: string, emotion: EmotionType = 'neutral'): string | null {
  loadCacheFromStorage();
  return memoryCache[npcId]?.[emotion]?.url || null;
}

export function setCachedPortrait(npcId: string, emotion: EmotionType, url: string): void {
  loadCacheFromStorage();
  
  if (!memoryCache[npcId]) {
    memoryCache[npcId] = {};
  }
  
  memoryCache[npcId][emotion] = {
    url,
    timestamp: Date.now()
  };
  
  saveCacheToStorage();
}

export function getAllCachedEmotions(npcId: string): EmotionType[] {
  loadCacheFromStorage();
  const entry = memoryCache[npcId];
  if (!entry) return [];
  return Object.keys(entry) as EmotionType[];
}

export function clearPortraitCache(): void {
  memoryCache = {};
  cacheLoaded = false;
  localStorage.removeItem(STORAGE_KEY);
}

export function clearNPCCache(npcId: string): void {
  loadCacheFromStorage();
  delete memoryCache[npcId];
  saveCacheToStorage();
}

// ============= MAIN NPC INITIALIZATION =============

export async function initializeMainNPC(
  npc: NPC,
  genre: string,
  era: EraId
): Promise<void> {
  // Always generate neutral first
  const neutralUrl = await generateNPCPortrait(npc, { genre, era, emotion: 'neutral' });
  
  if (neutralUrl) {
    // Queue common emotions for background generation
    const commonEmotions: EmotionType[] = ['happy', 'angry', 'sad', 'suspicious'];
    
    for (const emotion of commonEmotions) {
      queuePortraitGeneration(npc.id, emotion, genre, era, npc.meta.description);
    }
    
    // Additional emotions based on NPC type
    if (npc.meta.traits?.includes('lustful') || npc.meta.traits?.includes('friendly')) {
      queuePortraitGeneration(npc.id, 'flirty', genre, era, npc.meta.description);
    }
    
    if (npc.meta.traits?.includes('ambitious') || npc.meta.traits?.includes('cunning')) {
      queuePortraitGeneration(npc.id, 'smug', genre, era, npc.meta.description);
    }
  }
}

// ============= LEGACY COMPATIBILITY =============

export function buildPortraitPrompt(
  npc: NPC,
  config: PortraitConfig
): string {
  return buildConsistentPrompt(npc, config.emotion || 'neutral', config.genre, config.era);
}

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
