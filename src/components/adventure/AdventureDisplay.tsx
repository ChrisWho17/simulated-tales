import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCcw, Settings, Loader2 } from 'lucide-react';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
}

interface AdventureDisplayProps {
  story: StoryEntry[];
  onPlayerAction: (action: string) => void;
  onRestart: () => void;
  isLoading: boolean;
  cheatMode: boolean;
  onToggleCheatMode: () => void;
}

export function AdventureDisplay({
  story,
  onPlayerAction,
  onRestart,
  isLoading,
  cheatMode,
  onToggleCheatMode,
}: AdventureDisplayProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when story updates
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [story]);

  useEffect(() => {
    // Focus input when not loading
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onPlayerAction(input.trim());
      setInput('');
    }
  };

  const formatNarrativeContent = (content: string) => {
    // Split by paragraphs and format
    return content.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      // Check for dialogue (bold character name followed by quote)
      const dialogueMatch = paragraph.match(/^\*\*(.+?)\*\*:\s*"(.+)"$/);
      if (dialogueMatch) {
        return (
          <div key={idx} className="my-3 pl-4 border-l-2 border-primary/40">
            <span className="font-semibold text-primary">{dialogueMatch[1]}:</span>
            <span className="italic ml-2">"{dialogueMatch[2]}"</span>
          </div>
        );
      }

      // Bold text formatting
      const formattedParagraph = paragraph.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="text-primary font-semibold">$1</strong>'
      );

      // Italic text formatting
      const fullyFormatted = formattedParagraph.replace(
        /\*(.+?)\*/g,
        '<em>$1</em>'
      );

      return (
        <p
          key={idx}
          className="my-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: fullyFormatted }}
        />
      );
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border/30">
        <h1 className="text-xl font-narrative font-bold text-gradient-gold tracking-wide">
          UNTOLD
        </h1>
        <div className="flex items-center gap-2">
          {cheatMode && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              CHEAT MODE
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCheatMode}
            className="text-muted-foreground hover:text-foreground"
            title="Toggle Cheat Mode"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestart}
            className="text-muted-foreground hover:text-foreground"
            title="New Adventure"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Story Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          {story.map((entry, index) => (
            <div
              key={entry.id}
              className={`animate-fade-in mb-6 ${
                entry.role === 'user' 
                  ? 'text-right' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {entry.role === 'user' ? (
                <div className="inline-block max-w-[85%] bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                  <p className="text-sm text-primary/70 mb-1 font-ui">You</p>
                  <p className="font-narrative text-lg">{entry.content}</p>
                </div>
              ) : (
                <div className="font-narrative text-lg text-foreground leading-relaxed">
                  {formatNarrativeContent(entry.content)}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-narrative italic">The story unfolds...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/30 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you do?"
              className="flex-1 bg-card border-border/50 text-foreground placeholder:text-muted-foreground font-narrative text-lg py-6"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Describe your action, speak to characters, or explore your surroundings
          </p>
        </div>
      </div>
    </div>
  );
}
