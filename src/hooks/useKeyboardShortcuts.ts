import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;
      
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = (shortcut.ctrl ?? false) === (e.ctrlKey || e.metaKey);
      const shiftMatch = (shortcut.shift ?? false) === e.shiftKey;
      const altMatch = (shortcut.alt ?? false) === e.altKey;
      
      // For shortcuts with modifiers, allow in input fields
      const hasModifier = shortcut.ctrl || shortcut.meta || shortcut.alt;
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (!hasModifier && isInputField) continue;
        
        if (preventDefault) {
          e.preventDefault();
        }
        shortcut.action();
        return;
      }
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.filter(s => s.enabled !== false),
  };
}

// Predefined game shortcuts
export const GAME_SHORTCUTS = {
  CHARACTER_SHEET: { key: 'c', ctrl: true, description: 'Open Character Sheet' },
  INVENTORY: { key: 'i', ctrl: true, description: 'Open Inventory' },
  QUEST_JOURNAL: { key: 'j', ctrl: true, description: 'Open Quest Journal' },
  SETTINGS: { key: ',', ctrl: true, description: 'Open Settings' },
  QUICK_SAVE: { key: 's', ctrl: true, description: 'Quick Save' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close Modal/Panel' },
  FOCUS_INPUT: { key: '/', description: 'Focus Input' },
  SCROLL_BOTTOM: { key: 'End', description: 'Scroll to Latest' },
} as const;

// Helper to create shortcut help text
export function formatShortcut(config: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  
  if (config.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (config.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (config.alt) parts.push(isMac ? '⌥' : 'Alt');
  
  let key = config.key;
  if (key === 'Escape') key = 'Esc';
  if (key === ' ') key = 'Space';
  
  parts.push(key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
}
