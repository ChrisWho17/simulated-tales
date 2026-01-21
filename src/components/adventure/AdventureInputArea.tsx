// AdventureInputArea - Extracted input handling component from AdventureDisplay
// Handles command input, autocomplete, and submission

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { CommandAutocomplete, useCommandAutocomplete } from '@/components/game/CommandAutocomplete';
import { useToast } from '@/hooks/use-toast';

export interface CommandHandlers {
  onOpenInventory: () => void;
  onOpenCharacterSheet: () => void;
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
  onOpenQuickDiceRoll: () => void;
  onOpenRelationships: () => void;
  onOpenWeatherModal: () => void;
  onOpenSessionRecap: () => void;
  onToggleMapPanel: () => void;
  onOpenCompanionPanel: () => void;
  onOpenTimeDisplay: () => void;
  onOpenQuestQuickView: () => void;
  onOpenTimeSkipModal: () => void;
}

interface AdventureInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  showDiceRoll: boolean;
  commandHandlers: CommandHandlers;
  // The autocomplete hook state needs to be passed in for coordination
  commandAutocomplete: ReturnType<typeof useCommandAutocomplete>;
}

export function AdventureInputArea({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  showDiceRoll,
  commandHandlers,
  commandAutocomplete,
}: AdventureInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCommandSelect = (cmd: string) => {
    onInputChange(cmd);
    commandAutocomplete.close();
    
    // Auto-submit the command
    setTimeout(() => {
      const trimmed = cmd.toLowerCase();
      
      // Execute command immediately
      if (trimmed === '/inventory' || trimmed === '/inv' || trimmed === '/i') {
        commandHandlers.onOpenInventory();
        onInputChange('');
      } else if (trimmed === '/stats' || trimmed === '/character' || trimmed === '/char' || trimmed === '/c') {
        commandHandlers.onOpenCharacterSheet();
        onInputChange('');
      } else if (trimmed === '/bookmarks' || trimmed === '/bm') {
        commandHandlers.onOpenBookmarks();
        onInputChange('');
      } else if (trimmed === '/settings' || trimmed === '/options') {
        commandHandlers.onOpenSettings();
        onInputChange('');
      } else if (trimmed === '/roll' || trimmed === '/dice' || trimmed === '/r') {
        commandHandlers.onOpenQuickDiceRoll();
        onInputChange('');
      } else if (trimmed === '/relationships' || trimmed === '/rel' || trimmed === '/npcs') {
        commandHandlers.onOpenRelationships();
        onInputChange('');
      } else if (trimmed === '/weather' || trimmed === '/w') {
        commandHandlers.onOpenWeatherModal();
        onInputChange('');
      } else if (trimmed === '/recap') {
        commandHandlers.onOpenSessionRecap();
        onInputChange('');
      } else if (trimmed === '/map' || trimmed === '/m' || trimmed === '/location') {
        commandHandlers.onToggleMapPanel();
        onInputChange('');
      } else if (trimmed === '/companions' || trimmed === '/party' || trimmed === '/allies') {
        commandHandlers.onOpenCompanionPanel();
        onInputChange('');
      } else if (trimmed === '/time' || trimmed === '/t' || trimmed === '/clock') {
        commandHandlers.onOpenTimeDisplay();
        onInputChange('');
      } else if (trimmed === '/wait' || trimmed === '/skip') {
        commandHandlers.onOpenTimeSkipModal();
        onInputChange('');
      } else if (trimmed === '/quest' || trimmed === '/quests' || trimmed === '/journal' || trimmed === '/q') {
        commandHandlers.onOpenQuestQuickView();
        onInputChange('');
      } else if (trimmed === '/help' || trimmed === '/commands' || trimmed === '/?') {
        toast({
          title: '📖 Available Commands',
          description: '/recap • /inventory • /stats • /roll • /weather • /map • /time • /wait • /quest • /relationships • /companions • /bookmarks • /settings',
          duration: 5000,
        });
        onInputChange('');
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle autocomplete keyboard navigation first
    const handled = commandAutocomplete.handleKeyDown(e, input, (cmd) => {
      onInputChange(cmd);
      commandAutocomplete.close();
    });
    if (handled) return;
    
    // Normal enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      onSubmit();
    }
  };

  return (
    <div className="relative z-20 glass-panel border-0 border-t border-[rgba(139,92,246,0.2)] rounded-none p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 relative">
          {/* Command Autocomplete Dropdown */}
          <CommandAutocomplete
            inputValue={input}
            onSelectCommand={handleCommandSelect}
            visible={commandAutocomplete.visible}
            onClose={commandAutocomplete.close}
            selectedIndex={commandAutocomplete.selectedIndex}
            onSelectedIndexChange={commandAutocomplete.setSelectedIndex}
          />
          
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              commandAutocomplete.handleInputChange(e.target.value);
            }}
            placeholder="What do you do? (try /help for commands)"
            className="flex-1 bg-black/30 border-[rgba(139,92,246,0.3)] text-foreground placeholder:text-muted-foreground font-narrative text-base md:text-lg py-6 focus:border-primary focus:shadow-glow"
            style={{ fontSize: '16px' }}
            onKeyDown={handleKeyDown}
            disabled={isLoading || showDiceRoll}
          />
          <Button
            onClick={onSubmit}
            disabled={!input.trim() || isLoading || showDiceRoll}
            size="lg"
            className="px-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
