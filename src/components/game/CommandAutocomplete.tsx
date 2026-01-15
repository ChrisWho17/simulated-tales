// Command Autocomplete - Shows dropdown when typing "/"
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Backpack, ScrollText, Heart, Settings, HelpCircle,
  Bookmark, Map, Users, Dices, RotateCcw, Search, Cloud
} from 'lucide-react';

export interface SlashCommand {
  command: string;
  aliases: string[];
  description: string;
  icon: React.ReactNode;
  category: 'navigation' | 'game' | 'social' | 'system';
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/inventory',
    aliases: ['/inv', '/i'],
    description: 'Open your inventory',
    icon: <Backpack className="w-4 h-4" />,
    category: 'navigation',
  },
  {
    command: '/stats',
    aliases: ['/character', '/char', '/c'],
    description: 'View character sheet',
    icon: <ScrollText className="w-4 h-4" />,
    category: 'navigation',
  },
  {
    command: '/bookmarks',
    aliases: ['/bm'],
    description: 'View saved story moments',
    icon: <Bookmark className="w-4 h-4" />,
    category: 'navigation',
  },
  {
    command: '/map',
    aliases: ['/m', '/location'],
    description: 'Open the world map',
    icon: <Map className="w-4 h-4" />,
    category: 'navigation',
  },
  {
    command: '/relationships',
    aliases: ['/rel', '/npcs'],
    description: 'View NPC relationships',
    icon: <Users className="w-4 h-4" />,
    category: 'social',
  },
  {
    command: '/roll',
    aliases: ['/dice', '/r'],
    description: 'Roll dice manually',
    icon: <Dices className="w-4 h-4" />,
    category: 'game',
  },
  {
    command: '/weather',
    aliases: ['/w'],
    description: 'Check current weather',
    icon: <Cloud className="w-4 h-4" />,
    category: 'game',
  },
  {
    command: '/recap',
    aliases: [],
    description: 'Show story recap',
    icon: <RotateCcw className="w-4 h-4" />,
    category: 'game',
  },
  {
    command: '/checkself',
    aliases: [],
    description: 'Assess your condition',
    icon: <Heart className="w-4 h-4" />,
    category: 'game',
  },
  {
    command: '/settings',
    aliases: ['/options'],
    description: 'Open game settings',
    icon: <Settings className="w-4 h-4" />,
    category: 'system',
  },
  {
    command: '/help',
    aliases: ['/commands', '/?'],
    description: 'Show all commands',
    icon: <HelpCircle className="w-4 h-4" />,
    category: 'system',
  },
];

interface CommandAutocompleteProps {
  inputValue: string;
  onSelectCommand: (command: string) => void;
  visible: boolean;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function CommandAutocomplete({
  inputValue,
  onSelectCommand,
  visible,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
}: CommandAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Filter commands based on input
  const filteredCommands = React.useMemo(() => {
    if (!inputValue.startsWith('/')) return [];
    
    const query = inputValue.toLowerCase();
    
    // If just "/" show all commands
    if (query === '/') return SLASH_COMMANDS;
    
    return SLASH_COMMANDS.filter(cmd => {
      const matchesMain = cmd.command.toLowerCase().startsWith(query);
      const matchesAlias = cmd.aliases.some(a => a.toLowerCase().startsWith(query));
      return matchesMain || matchesAlias;
    });
  }, [inputValue]);
  
  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-command-item]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);
  
  if (!visible || filteredCommands.length === 0) return null;
  
  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    game: 'Game',
    social: 'Social',
    system: 'System',
  };
  
  // Group by category
  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);
  
  let globalIndex = 0;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-full left-0 right-0 mb-2 z-50"
      >
        <div 
          ref={listRef}
          className="bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto"
        >
          <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="w-3 h-3" />
            <span>Type to filter commands</span>
            <span className="ml-auto opacity-60">↑↓ Navigate • Enter Select • Esc Close</span>
          </div>
          
          {Object.entries(grouped).map(([category, commands]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                {categoryLabels[category]}
              </div>
              {commands.map((cmd) => {
                const itemIndex = globalIndex++;
                const isSelected = itemIndex === selectedIndex;
                
                return (
                  <button
                    key={cmd.command}
                    data-command-item
                    onClick={() => onSelectCommand(cmd.command)}
                    onMouseEnter={() => onSelectedIndexChange(itemIndex)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-3 text-left transition-colors",
                      isSelected 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "flex-shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      {cmd.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {cmd.command}
                        </span>
                        {cmd.aliases.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({cmd.aliases.join(', ')})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {cmd.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage autocomplete state
export function useCommandAutocomplete() {
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const handleInputChange = (value: string) => {
    if (value.startsWith('/')) {
      setVisible(true);
      setSelectedIndex(0);
    } else {
      setVisible(false);
    }
  };
  
  const handleKeyDown = (
    e: React.KeyboardEvent,
    inputValue: string,
    onSelectCommand: (cmd: string) => void
  ) => {
    if (!visible) return false;
    
    const query = inputValue.toLowerCase();
    const filteredCommands = query === '/' 
      ? SLASH_COMMANDS 
      : SLASH_COMMANDS.filter(cmd => {
          const matchesMain = cmd.command.toLowerCase().startsWith(query);
          const matchesAlias = cmd.aliases.some(a => a.toLowerCase().startsWith(query));
          return matchesMain || matchesAlias;
        });
    
    if (filteredCommands.length === 0) return false;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return true;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return true;
        
      case 'Enter':
      case 'Tab':
        if (filteredCommands[selectedIndex]) {
          e.preventDefault();
          onSelectCommand(filteredCommands[selectedIndex].command);
          setVisible(false);
          return true;
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setVisible(false);
        return true;
    }
    
    return false;
  };
  
  const close = () => setVisible(false);
  
  return {
    visible,
    selectedIndex,
    setSelectedIndex,
    handleInputChange,
    handleKeyDown,
    close,
  };
}
