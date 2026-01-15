import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'panels';
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: ['/', 'Focus'], description: 'Focus input field', category: 'navigation' },
  { keys: ['End'], description: 'Scroll to latest', category: 'navigation' },
  { keys: ['↑', '↓'], description: 'Input history', category: 'navigation' },
  { keys: ['Esc'], description: 'Close modal/panel', category: 'navigation' },
  
  // Actions
  { keys: ['Ctrl', 'S'], description: 'Quick save', category: 'actions' },
  { keys: ['Enter'], description: 'Submit action', category: 'actions' },
  { keys: ['Click'], description: 'Skip typewriter', category: 'actions' },
  { keys: ['?'], description: 'Show this help', category: 'actions' },
  
  // Panels
  { keys: ['Ctrl', 'C'], description: 'Character sheet', category: 'panels' },
  { keys: ['Ctrl', 'I'], description: 'Inventory', category: 'panels' },
  { keys: ['Ctrl', 'J'], description: 'Quest journal', category: 'panels' },
  { keys: ['Ctrl', ','], description: 'Settings', category: 'panels' },
  { keys: ['Ctrl', 'B'], description: 'Bookmarks', category: 'panels' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Debug diagnostics', category: 'panels' },
];

const CATEGORY_LABELS = {
  navigation: 'Navigation',
  actions: 'Actions',
  panels: 'Panels & Menus',
};

interface KeyboardShortcutsHelpProps {
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsHelp({ trigger }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  
  const formatKey = (key: string) => {
    if (key === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
    if (key === 'Shift') return isMac ? '⇧' : 'Shift';
    if (key === 'Alt') return isMac ? '⌥' : 'Alt';
    return key;
  };

  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="Keyboard shortcuts">
            <Keyboard className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center">
                          <kbd className={cn(
                            "px-2 py-1 text-xs font-mono rounded",
                            "bg-muted border border-border",
                            "min-w-[24px] text-center"
                          )}>
                            {formatKey(key)}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">?</kbd> anytime to show this help
        </p>
      </DialogContent>
    </Dialog>
  );
}
