import { useState, useCallback, useEffect } from 'react';
import { CompanionState, companionSystem } from '@/game/companionSystem';
import {
  PendingCompanionWithTiming,
  AppearanceTimingType,
  getPendingIntroductions,
  savePendingIntroductions,
  getNextReadyCompanion,
  shouldCompanionAppearNow,
  markCompanionDisplayed,
  updateCompanionTurnTracking,
  markContextTrigger,
  hasImmediateCompanions,
  buildCompanionIntroductionContext,
} from '@/game/companionTimingSystem';

// Re-export for backwards compatibility
export interface PendingCompanionIntroduction extends PendingCompanionWithTiming {}

interface UseCompanionIntroductionReturn {
  pendingIntroductions: PendingCompanionIntroduction[];
  currentIntroduction: PendingCompanionIntroduction | null;
  showIntroduction: () => void;
  dismissIntroduction: () => void;
  getNextIntroduction: (context?: AppearanceContext) => PendingCompanionIntroduction | null;
  hasUnreadIntroductions: boolean;
  markIntroductionAsDisplayed: (companionId: string) => void;
  getCompanionDialogue: (companionId: string) => string | null;
  // New timing-aware methods
  checkForReadyCompanion: (context: AppearanceContext) => PendingCompanionIntroduction | null;
  onPlayerAction: () => void;
  onSceneChange: () => void;
  onCombatEnd: () => void;
  onRest: () => void;
  onLocationChange: () => void;
  hasImmediateCompanion: boolean;
  getIntroductionContextForAI: () => string | null;
}

export interface AppearanceContext {
  turnNumber: number;
  isNewScene?: boolean;
  justFinishedCombat?: boolean;
  justRested?: boolean;
  locationChanged?: boolean;
  narrativeContext?: string;
}

/**
 * Hook for managing companion introduction dialogues in the story
 * Now with timing-aware companion appearances!
 */
export function useCompanionIntroduction(): UseCompanionIntroductionReturn {
  const [pendingIntroductions, setPendingIntroductions] = useState<PendingCompanionIntroduction[]>([]);
  const [currentIntroduction, setCurrentIntroduction] = useState<PendingCompanionIntroduction | null>(null);

  // Load pending introductions from localStorage
  const loadIntroductions = useCallback(() => {
    const intros = getPendingIntroductions();
    setPendingIntroductions(intros);
  }, []);

  // Load on mount and listen for storage changes
  useEffect(() => {
    loadIntroductions();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pending-companion-introductions') {
        loadIntroductions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadIntroductions]);

  // Check periodically for new introductions
  useEffect(() => {
    const interval = setInterval(loadIntroductions, 2000);
    return () => clearInterval(interval);
  }, [loadIntroductions]);

  // Get the next undisplayed introduction based on context
  const getNextIntroduction = useCallback((context?: AppearanceContext): PendingCompanionIntroduction | null => {
    if (context) {
      return getNextReadyCompanion(context);
    }
    // Fallback: return first undisplayed (legacy behavior)
    const undisplayed = pendingIntroductions.filter(i => !i.displayed);
    if (undisplayed.length > 0) {
      return undisplayed.sort((a, b) => a.timestamp - b.timestamp)[0];
    }
    return null;
  }, [pendingIntroductions]);

  // Check if any companion is ready to appear given current context
  const checkForReadyCompanion = useCallback((context: AppearanceContext): PendingCompanionIntroduction | null => {
    return getNextReadyCompanion(context);
  }, []);

  // Show the next pending introduction
  const showIntroduction = useCallback(() => {
    // For showing, prioritize 'immediately' timing
    const next = getNextIntroduction({ turnNumber: 0 });
    if (next) {
      setCurrentIntroduction(next);
      
      // Mark the companion as wanting to speak
      const companion = companionSystem.getCompanion(next.companionId);
      if (companion) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = next.introduction;
      }
    }
  }, [getNextIntroduction]);

  // Dismiss the current introduction
  const dismissIntroduction = useCallback(() => {
    if (currentIntroduction) {
      markCompanionDisplayed(currentIntroduction.companionId);
      loadIntroductions();
      
      // Clear the companion's pending reaction
      const companion = companionSystem.getCompanion(currentIntroduction.companionId);
      if (companion) {
        companion.wantsToSpeak = false;
        companion.pendingReaction = undefined;
      }
    }
    setCurrentIntroduction(null);
  }, [currentIntroduction, loadIntroductions]);

  // Mark a specific introduction as displayed
  const markIntroductionAsDisplayed = useCallback((companionId: string) => {
    markCompanionDisplayed(companionId);
    loadIntroductions();
  }, [loadIntroductions]);

  // Get saved dialogue for a companion
  const getCompanionDialogue = useCallback((companionId: string): string | null => {
    try {
      const intros = JSON.parse(localStorage.getItem('companion-introductions') || '{}');
      return intros[companionId] || null;
    } catch {
      return null;
    }
  }, []);

  // Timing event handlers
  const onPlayerAction = useCallback(() => {
    updateCompanionTurnTracking();
    loadIntroductions();
  }, [loadIntroductions]);

  const onSceneChange = useCallback(() => {
    // Scene changes make 'next_scene' companions eligible
    loadIntroductions();
  }, [loadIntroductions]);

  const onCombatEnd = useCallback(() => {
    markContextTrigger('combatEnded');
    loadIntroductions();
  }, [loadIntroductions]);

  const onRest = useCallback(() => {
    markContextTrigger('restOccurred');
    loadIntroductions();
  }, [loadIntroductions]);

  const onLocationChange = useCallback(() => {
    markContextTrigger('locationChanged');
    loadIntroductions();
  }, [loadIntroductions]);

  // Check if there's an immediate companion waiting
  const hasImmediateCompanion = hasImmediateCompanions();

  // Get AI context for next ready companion
  const getIntroductionContextForAI = useCallback((): string | null => {
    // Get companions ready to appear NOW
    const ready = getNextReadyCompanion({ 
      turnNumber: 0, 
      // Immediately timing should always be ready
    });
    
    if (ready) {
      return buildCompanionIntroductionContext(ready);
    }
    return null;
  }, []);

  const hasUnreadIntroductions = pendingIntroductions.some(i => !i.displayed);

  return {
    pendingIntroductions,
    currentIntroduction,
    showIntroduction,
    dismissIntroduction,
    getNextIntroduction,
    hasUnreadIntroductions,
    markIntroductionAsDisplayed,
    getCompanionDialogue,
    // New timing-aware methods
    checkForReadyCompanion,
    onPlayerAction,
    onSceneChange,
    onCombatEnd,
    onRest,
    onLocationChange,
    hasImmediateCompanion,
    getIntroductionContextForAI,
  };
}
