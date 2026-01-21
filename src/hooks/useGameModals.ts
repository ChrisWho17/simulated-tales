// ============================================================================
// GAME MODALS HOOK - Manages all modal state in one place
// ============================================================================

import { useState, useCallback } from 'react';

export interface GameModalsState {
  characterSheet: boolean;
  inventory: boolean;
  settings: boolean;
  bookmarks: boolean;
  sessionRecap: boolean;
  quickDiceRoll: boolean;
  relationshipsQuickView: boolean;
  timeDisplay: boolean;
  timeSkipModal: boolean;
  questQuickView: boolean;
  weatherModal: boolean;
  companions: boolean;
  mobileQuickMenu: boolean;
  ambientFeedModal: boolean;
  levelUpModal: boolean;
  checkSelfModal: boolean;
  mapPanel: boolean;
}

export interface GameModalsActions {
  open: (modal: keyof GameModalsState) => void;
  close: (modal: keyof GameModalsState) => void;
  toggle: (modal: keyof GameModalsState) => void;
  closeAll: () => void;
}

const initialState: GameModalsState = {
  characterSheet: false,
  inventory: false,
  settings: false,
  bookmarks: false,
  sessionRecap: false,
  quickDiceRoll: false,
  relationshipsQuickView: false,
  timeDisplay: false,
  timeSkipModal: false,
  questQuickView: false,
  weatherModal: false,
  companions: false,
  mobileQuickMenu: false,
  ambientFeedModal: false,
  levelUpModal: false,
  checkSelfModal: false,
  mapPanel: false,
};

export function useGameModals() {
  const [modals, setModals] = useState<GameModalsState>(initialState);

  const open = useCallback((modal: keyof GameModalsState) => {
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const close = useCallback((modal: keyof GameModalsState) => {
    setModals(prev => ({ ...prev, [modal]: false }));
  }, []);

  const toggle = useCallback((modal: keyof GameModalsState) => {
    setModals(prev => ({ ...prev, [modal]: !prev[modal] }));
  }, []);

  const closeAll = useCallback(() => {
    setModals(initialState);
  }, []);

  return {
    modals,
    actions: { open, close, toggle, closeAll } as GameModalsActions,
  };
}

// Convenience hook for single modal management
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen(prev => !prev), []),
  };
}
