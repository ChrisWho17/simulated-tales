import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  text: string;
  speed?: 'slow' | 'normal' | 'fast' | 'instant';
  onComplete?: () => void;
  enabled?: boolean;
  className?: string;
  renderText?: (text: string) => React.ReactNode;
  showCursor?: boolean;
}

const SPEED_CONFIG = {
  slow: { delay: 30, charsPerTick: 1 },
  normal: { delay: 15, charsPerTick: 2 },
  fast: { delay: 5, charsPerTick: 4 },
  instant: { delay: 0, charsPerTick: Infinity },
};

export function TypewriterText({
  text,
  speed = 'normal',
  onComplete,
  enabled = true,
  className,
  renderText,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeRef = useRef(false);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle typing animation
  useEffect(() => {
    if (!enabled || speed === 'instant') {
      setDisplayedLength(text.length);
      setIsComplete(true);
      if (!completeRef.current) {
        completeRef.current = true;
        onComplete?.();
      }
      return;
    }

    // Reset for new text
    setDisplayedLength(0);
    setIsComplete(false);
    completeRef.current = false;

    const config = SPEED_CONFIG[speed];
    
    intervalRef.current = setInterval(() => {
      setDisplayedLength(prev => {
        const next = Math.min(prev + config.charsPerTick, text.length);
        
        if (next >= text.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsComplete(true);
          if (!completeRef.current) {
            completeRef.current = true;
            onComplete?.();
          }
        }
        
        return next;
      });
    }, config.delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, enabled, onComplete]);

  // Skip to end on click
  const handleClick = useCallback(() => {
    if (!isComplete && enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayedLength(text.length);
      setIsComplete(true);
      if (!completeRef.current) {
        completeRef.current = true;
        onComplete?.();
      }
    }
  }, [isComplete, enabled, text.length, onComplete]);

  const displayedText = text.slice(0, displayedLength);
  
  return (
    <span 
      className={cn('relative', className)}
      onClick={handleClick}
      style={{ cursor: !isComplete && enabled ? 'pointer' : 'inherit' }}
    >
      {renderText ? renderText(displayedText) : displayedText}
      {showCursor && !isComplete && enabled && (
        <span className="animate-blink text-primary">▌</span>
      )}
    </span>
  );
}

// Component for rendering formatted narrative with typewriter effect
interface TypewriterNarrativeProps {
  content: string;
  speed?: 'slow' | 'normal' | 'fast' | 'instant';
  enabled?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterNarrative({
  content,
  speed = 'normal',
  enabled = true,
  onComplete,
  className,
}: TypewriterNarrativeProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(!enabled || speed === 'instant');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || speed === 'instant') {
      setDisplayedLength(content.length);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    setDisplayedLength(0);
    setIsComplete(false);

    const config = SPEED_CONFIG[speed];
    
    intervalRef.current = setInterval(() => {
      setDisplayedLength(prev => {
        const next = Math.min(prev + config.charsPerTick, content.length);
        
        if (next >= content.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsComplete(true);
          onComplete?.();
        }
        
        return next;
      });
    }, config.delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, speed, enabled]);

  const skipToEnd = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDisplayedLength(content.length);
    setIsComplete(true);
    onComplete?.();
  }, [content.length, onComplete]);

  // Format the displayed content
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i} className="block">
        {line.split(/\*\*(.+?)\*\*/g).map((part, j) => 
          j % 2 === 1 ? (
            <strong key={j} className="text-primary">{part}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </span>
    ));
  };

  const displayedContent = content.slice(0, displayedLength);

  return (
    <div 
      className={cn('relative', className)}
      onClick={!isComplete ? skipToEnd : undefined}
      style={{ cursor: !isComplete ? 'pointer' : 'inherit' }}
    >
      {formatContent(displayedContent)}
      {!isComplete && (
        <span className="animate-blink text-primary inline-block ml-0.5">▌</span>
      )}
    </div>
  );
}
