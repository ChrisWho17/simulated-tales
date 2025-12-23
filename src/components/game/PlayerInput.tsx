import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Eye, MessageSquare, MapPin, Clock, Backpack, HelpCircle } from 'lucide-react';

interface PlayerInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
}

const quickActions = [
  { label: 'Look', command: 'look', icon: Eye },
  { label: 'Status', command: 'status', icon: MessageSquare },
  { label: 'Inventory', command: 'inventory', icon: Backpack },
  { label: 'Wait', command: 'wait 1', icon: Clock },
  { label: 'Help', command: 'help', icon: HelpCircle },
];

export function PlayerInput({ onSubmit, disabled }: PlayerInputProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    
    onSubmit(input.trim());
    setHistory(prev => [...prev, input.trim()]);
    setHistoryIndex(-1);
    setInput('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(history[history.length - 1 - newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? '' : history[history.length - 1 - newIndex] || '');
    }
  };
  
  const handleQuickAction = (command: string) => {
    if (!disabled) {
      onSubmit(command);
      setHistory(prev => [...prev, command]);
    }
  };
  
  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {quickActions.map(({ label, command, icon: Icon }) => (
          <Button
            key={command}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction(command)}
            disabled={disabled}
            className="text-xs gap-1.5 bg-secondary/50 border-border hover:bg-secondary hover:border-primary/30 transition-all"
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>
      
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-mono">
            &gt;
          </span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your command..."
            disabled={disabled}
            className="pl-8 bg-background border-border focus:border-primary focus:ring-primary/20 font-mono"
          />
        </div>
        <Button 
          type="submit" 
          disabled={disabled || !input.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
