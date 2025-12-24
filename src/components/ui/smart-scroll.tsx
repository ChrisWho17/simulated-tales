import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// SMART SCROLL CONTAINER
// Preserves reading position, only auto-scrolls when at bottom
// ============================================================================

interface SmartScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  newContentThreshold?: number;
  showNewContentIndicator?: boolean;
}

export const SmartScrollContainer: React.FC<SmartScrollContainerProps> = ({ 
  children, 
  className = '',
  newContentThreshold = 50,
  showNewContentIndicator = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [newContentCount, setNewContentCount] = useState(0);
  const previousScrollHeight = useRef(0);
  const savedScrollTop = useRef(0);
  const wasAtBottom = useRef(true);

  // Check if user has scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom <= newContentThreshold;
  }, [newContentThreshold]);

  // Track scroll position continuously
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const trackPosition = () => {
      savedScrollTop.current = container.scrollTop;
      wasAtBottom.current = checkIfAtBottom();
      
      // Clear new content indicator when user reaches bottom
      if (wasAtBottom.current) {
        setHasNewContent(false);
        setNewContentCount(0);
      }
    };
    
    container.addEventListener('scroll', trackPosition);
    return () => container.removeEventListener('scroll', trackPosition);
  }, [checkIfAtBottom]);

  // Detect new content and handle scroll behavior
  useEffect(() => {
    if (!containerRef.current) return;

    const currentScrollHeight = containerRef.current.scrollHeight;
    
    // Content was added
    if (currentScrollHeight > previousScrollHeight.current) {
      if (wasAtBottom.current) {
        // User was at bottom, scroll to new content smoothly
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
      } else {
        // User was reading above, preserve position and show indicator
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = savedScrollTop.current;
          }
        });
        
        setHasNewContent(true);
        setNewContentCount(prev => prev + 1);
      }
    }
    
    previousScrollHeight.current = currentScrollHeight;
  }, [children]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
    
    setHasNewContent(false);
    setNewContentCount(0);
  }, []);

  return (
    <div className={cn('relative h-full', className)}>
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {children}
      </div>
      
      {/* New Content Indicator */}
      {showNewContentIndicator && hasNewContent && (
        <button 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 
                     bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full shadow-lg
                     hover:bg-primary transition-all duration-300 animate-bounce-subtle cursor-pointer
                     border border-primary-foreground/20"
          onClick={scrollToBottom}
        >
          <ChevronDown size={16} />
          <span className="text-sm font-medium">New content below</span>
          {newContentCount > 1 && (
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
              {newContentCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// STORY MESSAGE COMPONENT
// ============================================================================

type MessageType = 'narrative' | 'dialogue' | 'action' | 'system' | 'dice' | 'thought' | 'description';

interface StoryMessageProps {
  message: string;
  type?: MessageType;
  speaker?: string | null;
  timestamp?: number | null;
  isNew?: boolean;
  mood?: string | null;
  diceResult?: DiceResultData | null;
}

interface DiceResultData {
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
  actionName?: string;
}

export const StoryMessage: React.FC<StoryMessageProps> = ({ 
  message, 
  type = 'narrative',
  speaker = null,
  timestamp = null,
  isNew = false,
  mood = null,
  diceResult = null
}) => {
  const [isVisible, setIsVisible] = useState(!isNew);
  
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const typeStyles: Record<MessageType, string> = {
    narrative: 'story-narrative',
    dialogue: 'story-dialogue border-l-2 border-primary/50 pl-4 italic',
    action: 'story-action text-primary/90 font-medium',
    system: 'story-system text-muted-foreground text-sm',
    dice: 'story-dice bg-muted/30 p-3 rounded-lg',
    thought: 'story-thought italic text-muted-foreground/80',
    description: 'story-description text-foreground/90'
  };

  return (
    <div className={cn(
      'story-message transition-opacity duration-300',
      typeStyles[type] || '',
      isVisible ? 'opacity-100' : 'opacity-0'
    )}>
      {speaker && (
        <div className="message-speaker flex items-center gap-2 mb-1">
          <span className="speaker-name font-semibold text-primary">{speaker}</span>
          {mood && <span className="speaker-mood text-xs text-muted-foreground">({mood})</span>}
        </div>
      )}
      
      <div className="message-content">
        {type === 'dice' && diceResult ? (
          <DiceResultInline result={diceResult} />
        ) : (
          <p>{message}</p>
        )}
      </div>
      
      {timestamp && (
        <div className="message-timestamp text-xs text-muted-foreground mt-1">
          {formatTimestamp(timestamp)}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DICE RESULT INLINE DISPLAY
// ============================================================================

const DiceResultInline: React.FC<{ result: DiceResultData }> = ({ result }) => {
  const { roll, modifier, total, dc, success, criticalSuccess, criticalFailure, actionName } = result;
  
  return (
    <div className={cn(
      'dice-inline flex flex-col gap-1 p-2 rounded-md',
      success ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30',
      criticalSuccess && 'ring-2 ring-success/50',
      criticalFailure && 'ring-2 ring-destructive/50'
    )}>
      <div className="dice-roll-display flex items-center gap-2 text-sm font-mono">
        <span className="dice-icon">🎲</span>
        <span className="roll-value font-bold">{roll}</span>
        {modifier !== 0 && (
          <span className="roll-modifier text-muted-foreground">
            {modifier >= 0 ? '+' : ''}{modifier}
          </span>
        )}
        <span className="roll-equals">=</span>
        <span className={cn('roll-total font-bold', success ? 'text-success' : 'text-destructive')}>
          {total}
        </span>
        <span className="roll-vs text-muted-foreground">vs DC {dc}</span>
      </div>
      <div className="dice-result-label text-sm">
        {criticalSuccess && <span className="text-success font-bold">⭐ Critical Success!</span>}
        {criticalFailure && <span className="text-destructive font-bold">💀 Critical Failure!</span>}
        {!criticalSuccess && !criticalFailure && (
          <span className={success ? 'text-success' : 'text-destructive'}>
            {success ? '✓ Success' : '✗ Failure'}
          </span>
        )}
        {actionName && <span className="text-muted-foreground ml-2">({actionName})</span>}
      </div>
    </div>
  );
};

// ============================================================================
// STORY DISPLAY COMPONENT
// ============================================================================

interface StoryMessage {
  id?: string;
  text?: string;
  message?: string;
  type?: MessageType;
  speaker?: string | null;
  timestamp?: number;
  mood?: string | null;
  diceResult?: DiceResultData | null;
}

interface StoryDisplayProps {
  messages?: StoryMessage[];
  onMessageClick?: ((msg: StoryMessage) => void) | null;
  showTimestamps?: boolean;
  typingIndicator?: boolean;
  typingText?: string;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  messages = [], 
  onMessageClick = null,
  showTimestamps = false,
  typingIndicator = false,
  typingText = 'The story continues...'
}) => {
  const [displayedMessages, setDisplayedMessages] = useState<(StoryMessage & { isNew: boolean })[]>([]);
  const lastMessageCount = useRef(0);

  useEffect(() => {
    const newMessages = messages.map((msg, index) => ({
      ...msg,
      isNew: index >= lastMessageCount.current
    }));
    
    setDisplayedMessages(newMessages);
    lastMessageCount.current = messages.length;
  }, [messages]);

  return (
    <SmartScrollContainer className="story-display">
      <div className="story-content p-4 space-y-4">
        {displayedMessages.map((msg, index) => (
          <div 
            key={msg.id || index}
            onClick={() => onMessageClick?.(msg)}
            className={onMessageClick ? 'cursor-pointer hover:bg-muted/10 rounded transition-colors' : ''}
          >
            <StoryMessage
              message={msg.text || msg.message || ''}
              type={msg.type}
              speaker={msg.speaker}
              timestamp={showTimestamps ? msg.timestamp || null : null}
              isNew={msg.isNew}
              mood={msg.mood}
              diceResult={msg.diceResult}
            />
          </div>
        ))}
        
        {typingIndicator && (
          <div className="typing-indicator flex items-center gap-2 text-muted-foreground">
            <span className="typing-dots flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
            <span className="typing-text text-sm italic">{typingText}</span>
          </div>
        )}
      </div>
    </SmartScrollContainer>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useScrollPosition = (containerRef: React.RefObject<HTMLElement>) => {
  const [scrollPosition, setScrollPosition] = useState({
    top: 0,
    percentage: 0,
    isAtBottom: true,
    isAtTop: true
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      
      setScrollPosition({
        top: scrollTop,
        percentage: maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 100,
        isAtBottom: scrollTop >= maxScroll - 50,
        isAtTop: scrollTop <= 50
      });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return scrollPosition;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
};

export default SmartScrollContainer;
