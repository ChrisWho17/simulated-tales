// Cheat/dev slash-command detector.
// Extracted verbatim from CheatModeSplash.tsx — no behavior changes.
import { useState, useCallback } from 'react';
import type { DevPanelMode } from './cheatTypes';

export function useCheatModeCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<DevPanelMode>('cheat');
  
  const checkCommand = useCallback((input: string): boolean => {
    const trimmed = input.trim().toLowerCase();
    
    // Handle all cheat command variants
    if (trimmed === '/iamacheater' || trimmed === '/imacheater' || trimmed === '/cheat') {
      setInitialMode('cheat');
      setIsOpen(true);
      return true;
    }
    
    if (trimmed === '/events' || trimmed === '/eventbus') {
      setInitialMode('events');
      setIsOpen(true);
      return true;
    }
    
    if (trimmed === '/integrity' || trimmed === '/scan') {
      setInitialMode('integrity');
      setIsOpen(true);
      return true;
    }
    
    return false;
  }, []);
  
  return {
    isOpen,
    setIsOpen,
    initialMode,
    checkCommand,
  };
}
