import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GameEvent } from '@/types/game';
import { User, ChevronDown, History, BookOpen } from 'lucide-react';
import { cleanNarrativeForDisplay } from '@/lib/narrativeFilter';
import { cn } from '@/lib/utils';

// Performance optimization: Only show last N messages by default
const VISIBLE_MESSAGE_COUNT = 8;

interface NarrativeDisplayProps {
  events: GameEvent[];
  highlightedMessageId?: string | null;
  onRegisterMessage?: (messageId: string, element: HTMLDivElement | null, turnId?: number) => void;
  onContainerRef?: (element: HTMLDivElement | null) => void;
}

// Generate a summary of hidden story content
function generateStorySummary(hiddenEvents: GameEvent[]): string {
  if (hiddenEvents.length === 0) return '';
  
  // Extract key information from hidden events
  const dialogues: string[] = [];
  const discoveries: string[] = [];
  const actions: string[] = [];
  const locations: string[] = [];
  
  hiddenEvents.forEach(event => {
    const content = cleanNarrativeForDisplay(event.content);
    
    // Extract quoted dialogue
    const quoteMatches = content.match(/"([^"]+)"/g);
    if (quoteMatches && event.type === 'dialogue') {
      dialogues.push(...quoteMatches.slice(0, 2).map(q => q.replace(/"/g, '')));
    }
    
    // Look for discovery/observation keywords
    if (event.type === 'discovery' || content.includes('discover') || content.includes('notice') || content.includes('find')) {
      const firstSentence = content.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length < 100) {
        discoveries.push(firstSentence.trim());
      }
    }
    
    // Look for location mentions
    const locationPatterns = /(?:enter|arrive|reach|approach|inside|outside)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
    let match;
    while ((match = locationPatterns.exec(content)) !== null) {
      if (!locations.includes(match[1])) {
        locations.push(match[1]);
      }
    }
    
    // Extract action verbs from observation events
    if (event.type === 'observation') {
      const firstSentence = content.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length < 80) {
        actions.push(firstSentence.trim());
      }
    }
  });
  
  // Build a narrative summary
  const parts: string[] = [];
  
  // Opening
  parts.push(`In the earlier moments of your journey (${hiddenEvents.length} events ago)`);
  
  // Locations visited
  if (locations.length > 0) {
    parts.push(`you passed through ${locations.slice(0, 3).join(', ')}`);
  }
  
  // Key actions
  if (actions.length > 0) {
    const sampleActions = actions.slice(0, 3);
    parts.push(`where ${sampleActions[0].toLowerCase()}`);
    if (sampleActions.length > 1) {
      parts.push(`and ${sampleActions[1].toLowerCase()}`);
    }
  }
  
  // Discoveries
  if (discoveries.length > 0) {
    parts.push(`Along the way, ${discoveries[0].toLowerCase()}`);
  }
  
  // Dialogues
  if (dialogues.length > 0) {
    const sampleDialogues = dialogues.slice(0, 2);
    parts.push(`Words were exchanged: "${sampleDialogues[0]}"`);
    if (sampleDialogues.length > 1) {
      parts.push(`and "${sampleDialogues[1]}"`);
    }
  }
  
  // Fallback if we didn't extract much
  if (parts.length <= 1) {
    const eventTypes = hiddenEvents.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const typeDescriptions: string[] = [];
    if (eventTypes.dialogue) typeDescriptions.push(`${eventTypes.dialogue} conversation${eventTypes.dialogue > 1 ? 's' : ''}`);
    if (eventTypes.observation) typeDescriptions.push(`${eventTypes.observation} observation${eventTypes.observation > 1 ? 's' : ''}`);
    if (eventTypes.discovery) typeDescriptions.push(`${eventTypes.discovery} discover${eventTypes.discovery > 1 ? 'ies' : 'y'}`);
    if (eventTypes.action) typeDescriptions.push(`${eventTypes.action} action${eventTypes.action > 1 ? 's' : ''}`);
    
    return `Your adventure began with ${typeDescriptions.join(', ')}. The story unfolded through moments of tension and discovery, each step bringing you closer to where you stand now. The echoes of those early encounters still resonate, shaping the path ahead.`;
  }
  
  return parts.join('. ') + '.';
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
  const [showAllMessages, setShowAllMessages] = useState(false);
  const previousEventCount = useRef(events.length);
  
  // Calculate hidden and visible messages
  const hiddenCount = Math.max(0, events.length - VISIBLE_MESSAGE_COUNT);
  const hasHiddenMessages = hiddenCount > 0 && !showAllMessages;
  
  // Get visible events (either all or just the last N)
  const visibleEvents = useMemo(() => {
    if (showAllMessages || events.length <= VISIBLE_MESSAGE_COUNT) {
      return events;
    }
    return events.slice(-VISIBLE_MESSAGE_COUNT);
  }, [events, showAllMessages]);
  
  // Get hidden events for summary
  const hiddenEvents = useMemo(() => {
    if (showAllMessages || events.length <= VISIBLE_MESSAGE_COUNT) {
      return [];
    }
    return events.slice(0, -VISIBLE_MESSAGE_COUNT);
  }, [events, showAllMessages]);
  
  // Generate story summary
  const storySummary = useMemo(() => {
    return generateStorySummary(hiddenEvents);
  }, [hiddenEvents]);
  
  // Reset to collapsed view when story grows
  useEffect(() => {
    if (events.length > previousEventCount.current && showAllMessages) {
      // Auto-collapse when new content arrives
      setShowAllMessages(false);
    }
  }, [events.length, showAllMessages]);

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
        <div className="p-6 space-y-6 font-narrative text-xl leading-relaxed">
          {/* Hidden messages summary panel */}
          {hasHiddenMessages && (
            <div className="animate-fade-in mb-6">
              <div className="bg-muted/30 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Story So Far
                      </h3>
                      <button
                        onClick={() => setShowAllMessages(true)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          "bg-primary/10 hover:bg-primary/20 text-primary",
                          "border border-primary/20 hover:border-primary/40",
                          "flex items-center gap-1.5"
                        )}
                      >
                        <History className="w-3.5 h-3.5" />
                        Load Previous ({hiddenCount})
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {storySummary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Collapse button when showing all messages */}
          {showAllMessages && events.length > VISIBLE_MESSAGE_COUNT && (
            <div className="animate-fade-in mb-4">
              <button
                onClick={() => setShowAllMessages(false)}
                className={cn(
                  "w-full px-4 py-2 text-sm font-medium rounded-md transition-all",
                  "bg-muted/50 hover:bg-muted text-muted-foreground",
                  "border border-border/50 hover:border-border",
                  "flex items-center justify-center gap-2"
                )}
              >
                <ChevronDown className="w-4 h-4 rotate-180" />
                Collapse to Recent ({VISIBLE_MESSAGE_COUNT})
              </button>
            </div>
          )}
          
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
            visibleEvents.map((event, index) => (
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
            "p-3 rounded-full transition-all duration-300",
            "bg-primary/80 text-primary-foreground",
            "hover:bg-primary hover:scale-110",
            "border-2 border-primary-foreground/30",
            // Glow effect
            "shadow-[0_0_15px_rgba(var(--primary-rgb),0.5),0_0_30px_rgba(var(--primary-rgb),0.3)]",
            hasNewContent && [
              "animate-bounce",
              "shadow-[0_0_20px_rgba(var(--primary-rgb),0.7),0_0_40px_rgba(var(--primary-rgb),0.4)]"
            ]
          )}
          style={{
            // Fallback glow using primary color
            boxShadow: hasNewContent 
              ? '0 0 20px hsl(var(--primary) / 0.7), 0 0 40px hsl(var(--primary) / 0.4), 0 4px 12px rgba(0,0,0,0.3)'
              : '0 0 15px hsl(var(--primary) / 0.5), 0 0 30px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0,0,0,0.3)'
          }}
          aria-label="Scroll to latest message"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
