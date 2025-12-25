import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEvent } from '@/types/game';
import { User, ChevronDown } from 'lucide-react';
import { cleanNarrativeForDisplay } from '@/lib/narrativeFilter';
import { cn } from '@/lib/utils';

interface NarrativeDisplayProps {
  events: GameEvent[];
  highlightedMessageId?: string | null;
  onRegisterMessage?: (messageId: string, element: HTMLDivElement | null, turnId?: number) => void;
  onContainerRef?: (element: HTMLDivElement | null) => void;
}

export function NarrativeDisplay({ 
  events, 
  highlightedMessageId,
  onRegisterMessage,
  onContainerRef,
}: NarrativeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);
  const previousEventCount = useRef(events.length);

  // Track scroll position
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight <= 50;
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom();
      setIsAtBottom(atBottom);
      if (atBottom) {
        setHasNewContent(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Detect new content
  useEffect(() => {
    if (events.length > previousEventCount.current && !isAtBottom) {
      setHasNewContent(true);
    }
    previousEventCount.current = events.length;
  }, [events.length, isAtBottom]);

  // Register container ref with parent
  useEffect(() => {
    onContainerRef?.(containerRef.current);
  }, [onContainerRef]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setHasNewContent(false);
  }, []);

  // Safe text formatting using React components instead of dangerouslySetInnerHTML
  const formatTextSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    const parts = text.split(/\*\*(.+?)\*\*/g);
    
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        result.push(<strong key={`${keyPrefix}-${i}`} className="text-primary">{part}</strong>);
      } else if (part) {
        result.push(<span key={`${keyPrefix}-${i}`}>{part}</span>);
      }
    });
    
    return result;
  };

  const formatContent = (content: string) => {
    // Clean the content to remove OOC messages and technical talk
    const cleanedContent = cleanNarrativeForDisplay(content);
    
    return cleanedContent
      .split('\n')
      .map((line, i) => (
        <span key={i} className="block">
          {formatTextSegment(line, `line-${i}`)}
        </span>
      ));
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

  // Message element registration
  const registerRef = useCallback((event: GameEvent) => (element: HTMLDivElement | null) => {
    onRegisterMessage?.(event.id, element, event.timestamp);
  }, [onRegisterMessage]);
  
  return (
    <div className="relative h-full">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
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
                ref={registerRef(event)}
                data-message-id={event.id}
                data-turn-id={event.timestamp}
                className={cn(
                  "animate-fade-in transition-all duration-500",
                  getEventStyle(event.type),
                  // Highlight effect when jumping to message
                  highlightedMessageId === event.id && "ring-2 ring-primary/50 bg-primary/10 rounded-lg p-3 -m-3"
                )}
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
      </div>

      {/* Scroll to Latest Button - appears in bottom-right when not at bottom */}
      {(!isAtBottom || hasNewContent) && events.length > 0 && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 z-10",
            "p-3 rounded-full shadow-xl transition-all duration-300",
            "bg-card/90 backdrop-blur-md text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:scale-110",
            "border-2 border-primary/50",
            hasNewContent && "animate-bounce border-primary bg-primary/20"
          )}
          aria-label="Scroll to latest message"
        >
          <ChevronDown className={cn("w-6 h-6", hasNewContent && "text-primary")} />
        </button>
      )}
    </div>
  );
}
