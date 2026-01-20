// ============================================================================
// COMPANION TIMING SYSTEM
// Controls when custom companions appear in the story based on user selection
// ============================================================================

import { decompressAndLoad, compressAndStore } from '@/lib/storageCleanup';

export type AppearanceTimingType = 'immediately' | 'next_scene' | 'contextual';

export interface PendingCompanionWithTiming {
  companionId: string;
  name: string;
  introduction: string;
  portraitUrl: string | null;
  origin: string;
  appearanceTiming: AppearanceTimingType;
  timestamp: number;
  displayed: boolean;
  // Track when companion became eligible to appear
  eligibleSince?: number;
  // Track story context for contextual timing
  contextTriggers?: {
    turnsSinceCreated: number;
    combatEnded?: boolean;
    locationChanged?: boolean;
    restOccurred?: boolean;
  };
}

// Storage key for pending introductions
const STORAGE_KEY = 'pending-companion-introductions';

/**
 * Get all pending companion introductions
 * Uses decompressAndLoad to handle both compressed and uncompressed data
 */
export function getPendingIntroductions(): PendingCompanionWithTiming[] {
  try {
    return decompressAndLoad<PendingCompanionWithTiming[]>(STORAGE_KEY, []);
  } catch (e) {
    console.error('[CompanionTiming] Failed to load introductions:', e);
    return [];
  }
}

/**
 * Save pending introductions
 * Uses compressAndStore for automatic quota handling
 */
export function savePendingIntroductions(intros: PendingCompanionWithTiming[]): void {
  try {
    if (!compressAndStore(STORAGE_KEY, intros)) {
      console.error('[CompanionTiming] Failed to save introductions - storage full');
    }
  } catch (e) {
    console.error('[CompanionTiming] Failed to save introductions:', e);
  }
}

/**
 * Check if a companion should appear based on their timing setting
 */
export function shouldCompanionAppearNow(
  companion: PendingCompanionWithTiming,
  context: {
    turnNumber: number;
    isNewScene?: boolean;
    justFinishedCombat?: boolean;
    justRested?: boolean;
    locationChanged?: boolean;
    narrativeContext?: string;
  }
): boolean {
  // Already displayed
  if (companion.displayed) return false;

  switch (companion.appearanceTiming) {
    case 'immediately':
      // Always ready to appear on the very next action
      return true;

    case 'next_scene':
      // Appear when a new scene starts (location change, rest, or explicit scene break)
      return context.isNewScene || 
             context.locationChanged || 
             context.justRested ||
             // Also trigger if it's been at least 3 turns (fallback)
             (companion.contextTriggers?.turnsSinceCreated ?? 0) >= 3;

    case 'contextual':
      // Appear when narratively appropriate
      const triggers = companion.contextTriggers;
      if (!triggers) return false;
      
      // Good moments for contextual appearance:
      // 1. After combat ends (dramatic entrance or timely arrival)
      if (context.justFinishedCombat) return true;
      
      // 2. After resting (met during downtime)
      if (context.justRested) return true;
      
      // 3. Location change with enough delay (natural encounter)
      if (context.locationChanged && triggers.turnsSinceCreated >= 2) return true;
      
      // 4. After a reasonable number of turns (they were tracking you)
      if (triggers.turnsSinceCreated >= 5) return true;
      
      // 5. Check narrative context for key phrases suggesting a good moment
      if (context.narrativeContext) {
        const lowerContext = context.narrativeContext.toLowerCase();
        const goodMoments = [
          'you notice', 'a figure approaches', 'someone calls out',
          'footsteps', 'a voice', 'stranger', 'traveler', 'visitor',
          'the door opens', 'enters', 'arrives', 'approaches you',
          'you hear', 'catches your attention', 'looking for you'
        ];
        if (goodMoments.some(phrase => lowerContext.includes(phrase))) {
          return true;
        }
      }
      
      return false;

    default:
      return false;
  }
}

/**
 * Update turn tracking for all pending companions
 * Call this after each player action
 */
export function updateCompanionTurnTracking(): void {
  const intros = getPendingIntroductions();
  let updated = false;
  
  const updatedIntros = intros.map(intro => {
    if (!intro.displayed && intro.appearanceTiming !== 'immediately') {
      updated = true;
      return {
        ...intro,
        contextTriggers: {
          ...intro.contextTriggers,
          turnsSinceCreated: (intro.contextTriggers?.turnsSinceCreated ?? 0) + 1,
        }
      };
    }
    return intro;
  });
  
  if (updated) {
    savePendingIntroductions(updatedIntros);
  }
}

/**
 * Mark context triggers for all pending companions
 */
export function markContextTrigger(
  trigger: 'combatEnded' | 'locationChanged' | 'restOccurred'
): void {
  const intros = getPendingIntroductions();
  
  const updatedIntros = intros.map(intro => {
    if (!intro.displayed) {
      return {
        ...intro,
        contextTriggers: {
          ...intro.contextTriggers,
          turnsSinceCreated: intro.contextTriggers?.turnsSinceCreated ?? 0,
          [trigger]: true,
        }
      };
    }
    return intro;
  });
  
  savePendingIntroductions(updatedIntros);
}

/**
 * Get companions that are ready to appear based on current context
 */
export function getReadyCompanions(context: {
  turnNumber: number;
  isNewScene?: boolean;
  justFinishedCombat?: boolean;
  justRested?: boolean;
  locationChanged?: boolean;
  narrativeContext?: string;
}): PendingCompanionWithTiming[] {
  const intros = getPendingIntroductions();
  return intros.filter(intro => shouldCompanionAppearNow(intro, context));
}

/**
 * Get the next companion that should appear (respects priority: immediately > next_scene > contextual)
 */
export function getNextReadyCompanion(context: {
  turnNumber: number;
  isNewScene?: boolean;
  justFinishedCombat?: boolean;
  justRested?: boolean;
  locationChanged?: boolean;
  narrativeContext?: string;
}): PendingCompanionWithTiming | null {
  const ready = getReadyCompanions(context);
  
  if (ready.length === 0) return null;
  
  // Priority: immediately first, then next_scene, then contextual
  const priorityOrder: AppearanceTimingType[] = ['immediately', 'next_scene', 'contextual'];
  
  for (const timing of priorityOrder) {
    const match = ready.find(c => c.appearanceTiming === timing);
    if (match) return match;
  }
  
  // Fallback to first ready (sorted by timestamp)
  return ready.sort((a, b) => a.timestamp - b.timestamp)[0];
}

/**
 * Mark a companion introduction as displayed
 */
export function markCompanionDisplayed(companionId: string): void {
  const intros = getPendingIntroductions();
  const updatedIntros = intros.map(intro =>
    intro.companionId === companionId
      ? { ...intro, displayed: true }
      : intro
  );
  savePendingIntroductions(updatedIntros);
}

/**
 * Check if there are any companions waiting to appear with 'immediately' timing
 */
export function hasImmediateCompanions(): boolean {
  const intros = getPendingIntroductions();
  return intros.some(i => !i.displayed && i.appearanceTiming === 'immediately');
}

/**
 * Build context for AI to naturally introduce a waiting companion
 */
export function buildCompanionIntroductionContext(
  companion: PendingCompanionWithTiming
): string {
  const timing = companion.appearanceTiming;
  
  let timingNote = '';
  switch (timing) {
    case 'immediately':
      timingNote = 'This companion should appear RIGHT NOW in this very scene, as if they were waiting nearby.';
      break;
    case 'next_scene':
      timingNote = 'This companion should naturally appear as the scene transitions - perhaps entering the location or crossing paths with the player.';
      break;
    case 'contextual':
      timingNote = 'This companion should appear when it feels natural - after combat, during rest, or when the narrative calls for a new face.';
      break;
  }
  
  return `
[COMPANION ARRIVAL PENDING]
A new companion named "${companion.name}" is waiting to join the story.
Their origin: ${companion.origin?.replace(/_/g, ' ') || 'mysterious stranger'}
Introduction: ${companion.introduction}
Timing: ${timingNote}

When weaving this companion into the narrative:
- Make their entrance feel organic and dramatic
- Reference their origin/backstory naturally
- Give them dialogue that matches their introduction
- Don't break immersion - they should feel like a natural part of the world
`.trim();
}

console.log('[CompanionTiming] Companion timing system initialized');
