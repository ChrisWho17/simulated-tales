import { useRef, useEffect } from 'react';
import { GameEvent } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NarrativeDisplayProps {
  events: GameEvent[];
}

export function NarrativeDisplay({ events }: NarrativeDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);
  
  const formatContent = (content: string) => {
    // Convert markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
        return (
          <span 
            key={i} 
            className="block"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      });
  };
  
  const getEventStyle = (type: GameEvent['type']) => {
    switch (type) {
      case 'dialogue':
        return 'border-l-2 border-primary/50 pl-4 italic';
      case 'observation':
        return '';
      case 'system':
        return 'text-muted-foreground text-sm';
      case 'discovery':
        return 'bg-primary/5 p-3 rounded border border-primary/20';
      default:
        return '';
    }
  };
  
  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="p-6 space-y-6 font-narrative text-lg leading-relaxed">
        {events.length === 0 ? (
          <div className="animate-fade-in text-center py-12">
            <p className="text-muted-foreground italic">
              The world awaits your command...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Type "look" to examine your surroundings, or "help" for commands.
            </p>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className={`animate-fade-in ${getEventStyle(event.type)}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {formatContent(event.content)}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
