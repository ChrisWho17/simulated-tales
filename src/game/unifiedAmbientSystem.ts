/**
 * Unified Ambient System
 * Connects microEventCatalog and npcChatterSystem with shared cooldowns and genre-specific behavior.
 */

import type { GameState, NPC } from '@/types/game';
import {
  initializeChatterSystem,
  maybeEmitAmbientChatter,
  clearAmbientFeed,
  updateChatterConfig,
  type ChatterBeat,
  type ChatterFrequency,
} from './npcChatterSystem';
import {
  selectMicroEventFromCatalog,
  MicroEventRepeatBlocker,
  reskinMicroEventText,
  type MicroEventContext,
  type MicroEventTensionTier,
  type MicroEventTimeOfDay,
  type MicroEventLocation,
} from './microEventCatalog';

const microEventBlocker = new MicroEventRepeatBlocker();

// Genre profiles with numeric tension tiers
export interface GenreAmbientProfile {
  name: string;
  socialVsEnvironmentalBalance: number;
  baseFrequency: ChatterFrequency;
  microEventFrequency: 'rare' | 'normal' | 'frequent';
  chatterCooldownMultiplier: number;
  microEventCooldownMultiplier: number;
  defaultTensionTier: MicroEventTensionTier;
  hookChanceMultiplier: number;
}

export const GENRE_AMBIENT_PROFILES: Record<string, GenreAmbientProfile> = {
  postapocalyptic: { name: 'Post-Apocalyptic', socialVsEnvironmentalBalance: 30, baseFrequency: 'low', microEventFrequency: 'normal', chatterCooldownMultiplier: 1.5, microEventCooldownMultiplier: 0.8, defaultTensionTier: 3, hookChanceMultiplier: 1.2 },
  modern: { name: 'Modern Urban', socialVsEnvironmentalBalance: 75, baseFrequency: 'medium', microEventFrequency: 'frequent', chatterCooldownMultiplier: 0.7, microEventCooldownMultiplier: 1.0, defaultTensionTier: 1, hookChanceMultiplier: 0.8 },
  horror: { name: 'Horror', socialVsEnvironmentalBalance: 20, baseFrequency: 'low', microEventFrequency: 'rare', chatterCooldownMultiplier: 2.0, microEventCooldownMultiplier: 1.2, defaultTensionTier: 4, hookChanceMultiplier: 1.5 },
  noir: { name: 'Noir', socialVsEnvironmentalBalance: 60, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 1.0, microEventCooldownMultiplier: 1.0, defaultTensionTier: 3, hookChanceMultiplier: 1.3 },
  fantasy: { name: 'Fantasy', socialVsEnvironmentalBalance: 50, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 1.0, microEventCooldownMultiplier: 1.0, defaultTensionTier: 2, hookChanceMultiplier: 1.0 },
  scifi: { name: 'Science Fiction', socialVsEnvironmentalBalance: 55, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 0.9, microEventCooldownMultiplier: 0.9, defaultTensionTier: 2, hookChanceMultiplier: 1.1 },
  cyberpunk: { name: 'Cyberpunk', socialVsEnvironmentalBalance: 65, baseFrequency: 'high', microEventFrequency: 'frequent', chatterCooldownMultiplier: 0.6, microEventCooldownMultiplier: 0.8, defaultTensionTier: 3, hookChanceMultiplier: 1.2 },
  western: { name: 'Western', socialVsEnvironmentalBalance: 40, baseFrequency: 'low', microEventFrequency: 'normal', chatterCooldownMultiplier: 1.3, microEventCooldownMultiplier: 0.9, defaultTensionTier: 3, hookChanceMultiplier: 1.0 },
  romance: { name: 'Romance', socialVsEnvironmentalBalance: 80, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 0.8, microEventCooldownMultiplier: 1.2, defaultTensionTier: 1, hookChanceMultiplier: 0.7 },
  steampunk: { name: 'Steampunk', socialVsEnvironmentalBalance: 55, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 0.9, microEventCooldownMultiplier: 0.9, defaultTensionTier: 2, hookChanceMultiplier: 1.0 },
  survival: { name: 'Survival', socialVsEnvironmentalBalance: 35, baseFrequency: 'low', microEventFrequency: 'frequent', chatterCooldownMultiplier: 1.4, microEventCooldownMultiplier: 0.7, defaultTensionTier: 4, hookChanceMultiplier: 0.9 },
  mystery: { name: 'Mystery', socialVsEnvironmentalBalance: 55, baseFrequency: 'medium', microEventFrequency: 'normal', chatterCooldownMultiplier: 1.0, microEventCooldownMultiplier: 1.0, defaultTensionTier: 3, hookChanceMultiplier: 1.5 },
  thriller: { name: 'Thriller', socialVsEnvironmentalBalance: 45, baseFrequency: 'medium', microEventFrequency: 'frequent', chatterCooldownMultiplier: 0.8, microEventCooldownMultiplier: 0.8, defaultTensionTier: 4, hookChanceMultiplier: 1.3 },
  slice_of_life: { name: 'Slice of Life', socialVsEnvironmentalBalance: 85, baseFrequency: 'high', microEventFrequency: 'frequent', chatterCooldownMultiplier: 0.5, microEventCooldownMultiplier: 1.0, defaultTensionTier: 1, hookChanceMultiplier: 0.5 },
};

export interface UnifiedAmbientEntry {
  id: string;
  type: 'chatter' | 'microEvent';
  text: string;
  timestamp: number;
  category?: string;
  involvedNPCs?: string[];
  containsHook?: boolean;
}

interface AmbientState {
  currentProfile: GenreAmbientProfile;
  genre: string;
  globalCooldownRemaining: number;
  turnsSinceLastAmbient: number;
  recentAmbientIds: string[];
  unifiedFeed: UnifiedAmbientEntry[];
}

let ambientState: AmbientState = {
  currentProfile: GENRE_AMBIENT_PROFILES.modern,
  genre: 'modern',
  globalCooldownRemaining: 0,
  turnsSinceLastAmbient: 0,
  recentAmbientIds: [],
  unifiedFeed: [],
};

export function initializeUnifiedAmbient(genre: string): void {
  const profile = GENRE_AMBIENT_PROFILES[genre] || GENRE_AMBIENT_PROFILES.modern;
  ambientState = { currentProfile: profile, genre, globalCooldownRemaining: 0, turnsSinceLastAmbient: 0, recentAmbientIds: [], unifiedFeed: [] };
  initializeChatterSystem({ chatterFrequency: profile.baseFrequency, playerPullOnly: true, overheardHookChance: 0.08 * profile.hookChanceMultiplier });
}

export function setAmbientGenre(genre: string): void {
  const profile = GENRE_AMBIENT_PROFILES[genre] || GENRE_AMBIENT_PROFILES.modern;
  ambientState.currentProfile = profile;
  ambientState.genre = genre;
  updateChatterConfig({ chatterFrequency: profile.baseFrequency, overheardHookChance: 0.08 * profile.hookChanceMultiplier });
}

export interface AmbientTickResult {
  emitted: boolean;
  type?: 'chatter' | 'microEvent';
  entry?: UnifiedAmbientEntry;
  reason?: string;
}

export function processAmbientTick(state: GameState, options?: { forceEmit?: boolean; modalOpen?: boolean }): AmbientTickResult {
  if (options?.modalOpen) return { emitted: false, reason: 'modal_open' };
  if (!options?.forceEmit && ambientState.globalCooldownRemaining > 0) {
    ambientState.globalCooldownRemaining--;
    ambientState.turnsSinceLastAmbient++;
    return { emitted: false, reason: 'cooldown' };
  }

  const profile = ambientState.currentProfile;
  const roll = Math.random() * 100;
  const shouldChatter = roll < profile.socialVsEnvironmentalBalance;
  
  let entry: UnifiedAmbientEntry | null = null;
  
  if (shouldChatter) {
    const result = maybeEmitAmbientChatter(state, { forceEmit: true });
    if (result.emitted && result.beat) {
      entry = { id: result.beat.id, type: 'chatter', text: result.beat.text, timestamp: Date.now(), category: result.beat.topic, involvedNPCs: result.beat.involvedNPCs, containsHook: result.beat.containsHook };
    }
  }
  
  if (!entry) {
    const hour = state.time?.hour || 12;
    const timeOfDay: MicroEventTimeOfDay = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'night';
    const tensionLevel = (state as any).tensionLevel || 2;
    const tensionTier: MicroEventTensionTier = tensionLevel <= 1 ? 1 : tensionLevel <= 3 ? 2 : tensionLevel <= 5 ? 3 : tensionLevel <= 7 ? 4 : 5;
    
    const context: MicroEventContext = { location: 'anywhere', timeOfDay, currentTensionTier: tensionTier, gameGenre: ambientState.genre, turnsSinceLastMicroEvent: ambientState.turnsSinceLastAmbient };
    const event = selectMicroEventFromCatalog(context, microEventBlocker);
    
    if (event) {
      microEventBlocker.markUsed(event.id);
      const text = event.reskinnable ? reskinMicroEventText(event, ambientState.genre) : event.text;
      entry = { id: `micro_${Date.now()}`, type: 'microEvent', text, timestamp: Date.now(), category: event.genre, containsHook: !!event.contextHints?.length };
    }
  }
  
  if (entry) {
    ambientState.unifiedFeed.push(entry);
    while (ambientState.unifiedFeed.length > 12) ambientState.unifiedFeed.shift();
    ambientState.globalCooldownRemaining = Math.round(4 * (entry.type === 'chatter' ? profile.chatterCooldownMultiplier : profile.microEventCooldownMultiplier));
    ambientState.turnsSinceLastAmbient = 0;
    return { emitted: true, type: entry.type, entry };
  }
  
  ambientState.turnsSinceLastAmbient++;
  return { emitted: false, reason: 'generation_failed' };
}

export function getUnifiedAmbientFeed(): UnifiedAmbientEntry[] {
  return ambientState.unifiedFeed.filter(e => Date.now() - e.timestamp < 60000);
}

export function clearUnifiedAmbientFeed(): void {
  ambientState.unifiedFeed = [];
  clearAmbientFeed();
}

export function getCurrentAmbientProfile(): GenreAmbientProfile {
  return { ...ambientState.currentProfile };
}

export function getAmbientStats() {
  return { genre: ambientState.genre, cooldownRemaining: ambientState.globalCooldownRemaining, turnsSinceLastAmbient: ambientState.turnsSinceLastAmbient, feedSize: ambientState.unifiedFeed.length };
}

export function onWorldTick(state: GameState): AmbientTickResult { return processAmbientTick(state); }
export function onPlayerAction(state: GameState): AmbientTickResult { return processAmbientTick(state); }

export function buildAmbientContextForAI(): string {
  const feed = getUnifiedAmbientFeed();
  if (feed.length === 0) return '';
  return `## AMBIENT ATMOSPHERE\n${feed.slice(-3).map(e => `- ${e.text}`).join('\n')}\n\nWeave these naturally into the scene as background texture.`;
}

if (typeof window !== 'undefined') {
  (window as any).unifiedAmbient = { initializeUnifiedAmbient, setAmbientGenre, processAmbientTick, getUnifiedAmbientFeed, clearUnifiedAmbientFeed, getCurrentAmbientProfile, getAmbientStats, buildAmbientContextForAI, onWorldTick, onPlayerAction, GENRE_AMBIENT_PROFILES };
}
