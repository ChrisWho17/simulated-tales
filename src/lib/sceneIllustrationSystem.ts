// Scene Illustration System - AI-generated scenes using character portraits
import { NPC, GameState } from '@/types/game';

export interface SceneContext {
  type: 'arrival' | 'meeting' | 'dramatic' | 'combat' | 'romantic' | 'discovery';
  location: string;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: string;
  mood?: 'tense' | 'calm' | 'mysterious' | 'romantic' | 'dangerous' | 'joyful';
}

export interface CharacterDescription {
  id: string;
  name: string;
  age: number;
  gender: string;
  appearance: {
    hairColor?: string;
    eyeColor?: string;
    bodyType?: string;
    height?: string;
    distinguishingFeatures?: string[];
  };
  currentEmotion?: string;
  portraitDescription?: string;
}

export interface SceneIllustrationRequest {
  context: SceneContext;
  player: CharacterDescription;
  npcs: CharacterDescription[];
  action: string;
  genre: string;
  era: string;
}

// Genre-based art styles
const GENRE_STYLES: Record<string, string> = {
  fantasy: 'detailed fantasy concept art, painterly, magical atmosphere',
  scifi: 'sci-fi digital art, neon lighting, futuristic aesthetic',
  horror: 'dark atmospheric horror art, moody shadows, unsettling',
  western: 'western illustration, dusty warm tones, frontier aesthetic',
  noir: 'noir style, high contrast, dramatic shadows, 1940s aesthetic',
  postapocalyptic: 'post-apocalyptic concept art, gritty, ruined environment',
  victorian: 'victorian era illustration, gaslight aesthetic, detailed period clothing',
  cyberpunk: 'cyberpunk digital art, neon colors, rain-slicked streets',
  medieval: 'medieval fantasy art, castles and knights, rich detail',
  modern: 'contemporary realistic style, modern urban setting',
};

// Time of day lighting
const TIME_LIGHTING: Record<string, string> = {
  dawn: 'soft golden hour light, misty atmosphere, warm and cool tones',
  morning: 'bright natural daylight, clear visibility, fresh atmosphere',
  afternoon: 'warm sunlight, defined shadows, vibrant colors',
  evening: 'golden sunset lighting, long shadows, warm orange tones',
  night: 'moonlit darkness, dramatic shadows, cool blue tones, artificial lights',
};

// Mood atmosphere
const MOOD_ATMOSPHERE: Record<string, string> = {
  tense: 'dramatic composition, high contrast, uneasy atmosphere',
  calm: 'peaceful composition, soft lighting, serene atmosphere',
  mysterious: 'foggy, hidden details, enigmatic atmosphere',
  romantic: 'soft focus, warm lighting, intimate atmosphere',
  dangerous: 'dynamic angles, threatening shadows, intense atmosphere',
  joyful: 'bright colors, open composition, cheerful atmosphere',
};

// Build character description for prompt
function buildCharacterPrompt(char: CharacterDescription, role: string): string {
  const parts: string[] = [];
  
  // Basic description
  parts.push(`${char.age} year old ${char.gender}`);
  
  // Appearance details
  const app = char.appearance;
  if (app.hairColor) parts.push(`${app.hairColor} hair`);
  if (app.eyeColor) parts.push(`${app.eyeColor} eyes`);
  if (app.bodyType) parts.push(`${app.bodyType} build`);
  if (app.height) parts.push(`${app.height}`);
  
  // Distinguishing features
  if (app.distinguishingFeatures && app.distinguishingFeatures.length > 0) {
    parts.push(app.distinguishingFeatures.join(', '));
  }
  
  // Use stored portrait description for consistency
  if (char.portraitDescription) {
    return `${role}: ${char.portraitDescription}`;
  }
  
  return `${role}: ${parts.join(', ')}`;
}

// Build the complete scene prompt
export function buildScenePrompt(request: SceneIllustrationRequest): string {
  const { context, player, npcs, action, genre, era } = request;
  
  // Art style
  const artStyle = GENRE_STYLES[genre] || GENRE_STYLES.fantasy;
  
  // Characters
  const characterDescriptions: string[] = [];
  characterDescriptions.push(buildCharacterPrompt(player, 'protagonist'));
  
  npcs.forEach((npc, index) => {
    const role = npcs.length === 1 ? 'companion' : `figure ${index + 2}`;
    characterDescriptions.push(buildCharacterPrompt(npc, role));
  });
  
  // Lighting
  const lighting = TIME_LIGHTING[context.timeOfDay] || TIME_LIGHTING.afternoon;
  
  // Mood
  const atmosphere = context.mood ? MOOD_ATMOSPHERE[context.mood] : '';
  
  // Weather
  const weatherDesc = context.weather ? `, ${context.weather} weather` : '';
  
  // Build final prompt
  const promptParts = [
    artStyle,
    characterDescriptions.length > 0 ? characterDescriptions.join(', ') : '',
    action,
    `${context.location}${weatherDesc}`,
    lighting,
    atmosphere,
    `${era} ${genre} aesthetic`,
    'cinematic composition, highly detailed',
  ].filter(p => p.length > 0);
  
  return promptParts.join(', ');
}

// Determine if a scene warrants illustration
export function shouldGenerateIllustration(
  eventType: string,
  lastIllustrationTime: number,
  minimumInterval: number = 60000 // 1 minute minimum between illustrations
): boolean {
  const now = Date.now();
  if (now - lastIllustrationTime < minimumInterval) {
    return false;
  }
  
  // Events that warrant illustration
  const illustratableEvents = [
    'location_arrival',
    'first_meeting',
    'combat_start',
    'dramatic_moment',
    'romantic_scene',
    'discovery',
    'major_choice',
  ];
  
  return illustratableEvents.includes(eventType);
}

// Extract character description from NPC for scene use
export function npcToCharacterDescription(npc: NPC): CharacterDescription {
  const appearance = (npc as any).appearance || {};
  
  return {
    id: npc.id,
    name: npc.meta.name,
    age: npc.meta.age,
    gender: (npc as any).gender || 'person',
    appearance: {
      hairColor: appearance.hairColor,
      eyeColor: appearance.eyeColor,
      bodyType: appearance.bodyType,
      height: appearance.height,
      distinguishingFeatures: appearance.distinguishingFeatures || [],
    },
    currentEmotion: npc.emotionalState.current,
    portraitDescription: (npc as any).portraitDescription,
  };
}

// Get time of day from hour
export function getTimeOfDay(hour: number): SceneContext['timeOfDay'] {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

// Determine mood from game context
export function determineMood(
  gameState: GameState,
  npcsInScene: NPC[]
): SceneContext['mood'] {
  // Check for dangerous situations
  const playerHealth = gameState.lifeSim?.needs.physical.health ?? gameState.player.stats.health;
  if (playerHealth < 30) return 'dangerous';
  
  // Check NPC relationships
  const hostileNPC = npcsInScene.find(npc => {
    const rel = npc.relationships.player;
    return rel && (rel.fear > 50 || rel.affection < -30);
  });
  if (hostileNPC) return 'tense';
  
  // Check for romantic NPCs
  const romanticNPC = npcsInScene.find(npc => {
    const rel = npc.relationships.player;
    return rel && rel.affection > 50 && rel.trust > 30;
  });
  if (romanticNPC) return 'romantic';
  
  // Default to calm
  return 'calm';
}
