// ============================================================================
// COMPANION ORCHESTRATION HOOK - Manages companion UI state and interactions
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { CompanionState, companionSystem } from '@/game/companionSystem';
import { useCompanionSystem } from './useCompanionSystem';

export interface CompanionOrchestrationState {
  showPanel: boolean;
  showCreator: boolean;
  activeCompanions: CompanionState[];
  pendingIntroductions: string[];
}

export interface CompanionOrchestrationActions {
  openPanel: () => void;
  closePanel: () => void;
  openCreator: () => void;
  closeCreator: () => void;
  refreshCompanions: () => void;
  handleCompanionCreated: (companion: CompanionState) => void;
  getActiveCompanionCount: () => number;
}

export function useCompanionOrchestration(options?: { genre?: string; enableAIDialogue?: boolean }) {
  const [showPanel, setShowPanel] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [activeCompanions, setActiveCompanions] = useState<CompanionState[]>([]);
  const [pendingIntroductions, setPendingIntroductions] = useState<string[]>([]);

  const companionHook = useCompanionSystem({
    enableAIDialogue: options?.enableAIDialogue ?? true,
    genre: options?.genre ?? 'fantasy',
  });

  // Refresh companion list
  const refreshCompanions = useCallback(() => {
    const companions = companionSystem.getActiveCompanions();
    setActiveCompanions(companions);
    
    // Check for pending introductions
    try {
      const pending = localStorage.getItem('pending-companion-introductions');
      if (pending) {
        const parsed = JSON.parse(pending);
        setPendingIntroductions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      setPendingIntroductions([]);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshCompanions();
    const interval = setInterval(refreshCompanions, 5000);
    return () => clearInterval(interval);
  }, [refreshCompanions]);

  const openPanel = useCallback(() => setShowPanel(true), []);
  const closePanel = useCallback(() => setShowPanel(false), []);
  const openCreator = useCallback(() => setShowCreator(true), []);
  const closeCreator = useCallback(() => setShowCreator(false), []);

  const handleCompanionCreated = useCallback((companion: CompanionState) => {
    refreshCompanions();
    setShowCreator(false);
  }, [refreshCompanions]);

  const getActiveCompanionCount = useCallback(() => {
    return activeCompanions.length;
  }, [activeCompanions.length]);

  return {
    // State
    state: {
      showPanel,
      showCreator,
      activeCompanions,
      pendingIntroductions,
    } as CompanionOrchestrationState,
    
    // Actions
    actions: {
      openPanel,
      closePanel,
      openCreator,
      closeCreator,
      refreshCompanions,
      handleCompanionCreated,
      getActiveCompanionCount,
    } as CompanionOrchestrationActions,
    
    // Raw companion system hook for advanced usage
    companionSystem: companionHook,
  };
}
