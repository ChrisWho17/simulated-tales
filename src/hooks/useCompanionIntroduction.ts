import { useState, useCallback, useEffect } from 'react';
import { CompanionState, companionSystem } from '@/game/companionSystem';

export interface PendingCompanionIntroduction {
  companionId: string;
  name: string;
  introduction: string;
  portraitUrl: string | null;
  origin: string;
  timestamp: number;
  displayed: boolean;
}

interface UseCompanionIntroductionReturn {
  pendingIntroductions: PendingCompanionIntroduction[];
  currentIntroduction: PendingCompanionIntroduction | null;
  showIntroduction: () => void;
  dismissIntroduction: () => void;
  getNextIntroduction: () => PendingCompanionIntroduction | null;
  hasUnreadIntroductions: boolean;
  markIntroductionAsDisplayed: (companionId: string) => void;
  getCompanionDialogue: (companionId: string) => string | null;
}

/**
 * Hook for managing companion introduction dialogues in the story
 * When a companion is created via cheat mode, their introduction is queued
 * and will be displayed in the story flow
 */
export function useCompanionIntroduction(): UseCompanionIntroductionReturn {
  const [pendingIntroductions, setPendingIntroductions] = useState<PendingCompanionIntroduction[]>([]);
  const [currentIntroduction, setCurrentIntroduction] = useState<PendingCompanionIntroduction | null>(null);

  // Load pending introductions from localStorage
  const loadIntroductions = useCallback(() => {
    try {
      const stored = localStorage.getItem('pending-companion-introductions');
      if (stored) {
        const intros = JSON.parse(stored) as PendingCompanionIntroduction[];
        setPendingIntroductions(intros);
      }
    } catch (e) {
      console.error('Failed to load companion introductions:', e);
    }
  }, []);

  // Save introductions to localStorage
  const saveIntroductions = useCallback((intros: PendingCompanionIntroduction[]) => {
    try {
      localStorage.setItem('pending-companion-introductions', JSON.stringify(intros));
      setPendingIntroductions(intros);
    } catch (e) {
      console.error('Failed to save companion introductions:', e);
    }
  }, []);

  // Load on mount and listen for storage changes
  useEffect(() => {
    loadIntroductions();

    // Listen for storage changes from other tabs/components
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

  // Get the next undisplayed introduction
  const getNextIntroduction = useCallback((): PendingCompanionIntroduction | null => {
    const undisplayed = pendingIntroductions.filter(i => !i.displayed);
    if (undisplayed.length > 0) {
      // Sort by timestamp, oldest first
      return undisplayed.sort((a, b) => a.timestamp - b.timestamp)[0];
    }
    return null;
  }, [pendingIntroductions]);

  // Show the next pending introduction
  const showIntroduction = useCallback(() => {
    const next = getNextIntroduction();
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
      // Mark as displayed
      const updated = pendingIntroductions.map(i =>
        i.companionId === currentIntroduction.companionId
          ? { ...i, displayed: true }
          : i
      );
      saveIntroductions(updated);
      
      // Clear the companion's pending reaction
      const companion = companionSystem.getCompanion(currentIntroduction.companionId);
      if (companion) {
        companion.wantsToSpeak = false;
        companion.pendingReaction = undefined;
      }
    }
    setCurrentIntroduction(null);
  }, [currentIntroduction, pendingIntroductions, saveIntroductions]);

  // Mark a specific introduction as displayed
  const markIntroductionAsDisplayed = useCallback((companionId: string) => {
    const updated = pendingIntroductions.map(i =>
      i.companionId === companionId
        ? { ...i, displayed: true }
        : i
    );
    saveIntroductions(updated);
  }, [pendingIntroductions, saveIntroductions]);

  // Get saved dialogue for a companion (from the introductions store)
  const getCompanionDialogue = useCallback((companionId: string): string | null => {
    try {
      const intros = JSON.parse(localStorage.getItem('companion-introductions') || '{}');
      return intros[companionId] || null;
    } catch {
      return null;
    }
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
  };
}
