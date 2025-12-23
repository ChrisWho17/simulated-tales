import { useRef, useEffect } from 'react';
import { GameEvent } from '@/types/game';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from 'lucide-react';

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
              {/* Show NPC portrait for dialogue events */}
              {event.type === 'dialogue' && event.npcPortrait && (
                <div className="flex items-start gap-4 mb-2">
                  <div className="w-16 h-20 rounded-lg border-2 border-primary/30 bg-muted/20 overflow-hidden shrink-0 shadow-lg">
                    <img 
                      src={event.npcPortrait} 
                      alt="NPC portrait" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 pt-2">
                    {formatContent(event.content)}
                  </div>
                </div>
              )}
              
              {/* Show placeholder portrait for dialogue without generated portrait */}
              {event.type === 'dialogue' && !event.npcPortrait && (
                <div className="flex items-start gap-4 mb-2">
                  <div className="w-16 h-20 rounded-lg border-2 border-dashed border-border/50 bg-muted/10 flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="flex-1 pt-2">
                    {formatContent(event.content)}
                  </div>
                </div>
              )}
              
              {/* Regular content for non-dialogue events */}
              {event.type !== 'dialogue' && formatContent(event.content)}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
