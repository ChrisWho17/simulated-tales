// ============================================================================
// GAME UI ORCHESTRATION HOOK - Coordinates all UI state for the main game
// ============================================================================

import { useCallback, useMemo } from 'react';
import { useGameModals } from './useGameModals';
import { useCompanionOrchestration } from './useCompanionOrchestration';

interface UseGameUIOptions {
  genre?: string;
  enableAIDialogue?: boolean;
}

export function useGameUI(options: UseGameUIOptions = {}) {
  const { modals, actions: modalActions } = useGameModals();
  const companions = useCompanionOrchestration({
    genre: options.genre,
    enableAIDialogue: options.enableAIDialogue ?? true,
  });

  // Quick action handlers for menus
  const quickActions = useMemo(() => ({
    openSettings: () => modalActions.open('settings'),
    openCharacterSheet: () => modalActions.open('characterSheet'),
    openInventory: () => modalActions.open('inventory'),
    openBookmarks: () => modalActions.open('bookmarks'),
    openWeather: () => modalActions.open('weatherModal'),
    openTime: () => modalActions.open('timeDisplay'),
    openRecap: () => modalActions.open('sessionRecap'),
    openSaves: () => window.dispatchEvent(new CustomEvent('open-saves-dropdown')),
    openCompanions: () => companions.actions.openPanel(),
    openQuests: () => modalActions.open('questQuickView'),
    openRelationships: () => modalActions.open('relationshipsQuickView'),
    openDiceRoll: () => modalActions.open('quickDiceRoll'),
    openAmbientFeed: () => modalActions.open('ambientFeedModal'),
  }), [modalActions, companions.actions]);

  // Keyboard shortcut handler
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'i':
          e.preventDefault();
          modalActions.toggle('inventory');
          break;
        case 'b':
          e.preventDefault();
          modalActions.toggle('bookmarks');
          break;
        case 'k':
          e.preventDefault();
          modalActions.toggle('characterSheet');
          break;
        case 'j':
          e.preventDefault();
          modalActions.toggle('questQuickView');
          break;
      }
    }
  }, [modalActions]);

  return {
    // All modal states
    modals,
    modalActions,
    
    // Companion system
    companions,
    
    // Quick actions for menus
    quickActions,
    
    // Keyboard handler
    handleKeyboardShortcut,
  };
}
