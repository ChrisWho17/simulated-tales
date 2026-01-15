import { useState, useEffect, useRef, useCallback } from 'react';

interface TypewriterOptions {
  speed?: 'slow' | 'normal' | 'fast' | 'instant';
  onComplete?: () => void;
  enabled?: boolean;
}

const SPEED_MAP = {
  slow: 40,
  normal: 20,
  fast: 8,
  instant: 0,
};

export function useTypewriter(
  text: string,
  options: TypewriterOptions = {}
) {
  const { speed = 'normal', onComplete, enabled = true } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip to end
  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayedText(text);
    setIsTyping(false);
    setIsComplete(true);
    indexRef.current = text.length;
    onComplete?.();
  }, [text, onComplete]);

  // Reset when text changes
  useEffect(() => {
    if (!enabled || speed === 'instant') {
      setDisplayedText(text);
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    // Reset state for new text
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);
    setIsComplete(false);

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        // Type multiple characters at once for faster speeds
        const charsToAdd = speed === 'fast' ? 3 : speed === 'normal' ? 2 : 1;
        const nextIndex = Math.min(indexRef.current + charsToAdd, text.length);
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;
        
        timeoutRef.current = setTimeout(typeNextChar, SPEED_MAP[speed]);
      } else {
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    };

    timeoutRef.current = setTimeout(typeNextChar, SPEED_MAP[speed]);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, enabled, onComplete]);

  return {
    displayedText,
    isTyping,
    isComplete,
    skipToEnd,
  };
}

// Hook for managing multiple typewriter entries (story mode)
export function useStoryTypewriter(
  entries: Array<{ id: string; content: string; role: string }>,
  options: { speed?: 'slow' | 'normal' | 'fast' | 'instant'; enabled?: boolean } = {}
) {
  const { speed = 'normal', enabled = true } = options;
  const [typingEntryId, setTypingEntryId] = useState<string | null>(null);
  const [completedEntries, setCompletedEntries] = useState<Set<string>>(new Set());
  
  // Mark all existing entries as completed initially
  useEffect(() => {
    if (entries.length > 0 && completedEntries.size === 0) {
      // Initially mark all but the last narrator entry as complete
      const allButLast = entries.slice(0, -1).map(e => e.id);
      setCompletedEntries(new Set(allButLast));
      
      const lastEntry = entries[entries.length - 1];
      if (lastEntry?.role === 'narrator' && enabled && speed !== 'instant') {
        setTypingEntryId(lastEntry.id);
      } else {
        setCompletedEntries(new Set(entries.map(e => e.id)));
      }
    }
  }, []);

  // Handle new entries
  useEffect(() => {
    if (entries.length === 0) return;
    
    const lastEntry = entries[entries.length - 1];
    
    // If we have a new entry that's not completed
    if (!completedEntries.has(lastEntry.id)) {
      if (lastEntry.role === 'narrator' && enabled && speed !== 'instant') {
        setTypingEntryId(lastEntry.id);
      } else {
        // User entries complete instantly
        setCompletedEntries(prev => new Set([...prev, lastEntry.id]));
      }
    }
  }, [entries, enabled, speed]);

  const markComplete = useCallback((id: string) => {
    setCompletedEntries(prev => new Set([...prev, id]));
    setTypingEntryId(null);
  }, []);

  const skipCurrent = useCallback(() => {
    if (typingEntryId) {
      markComplete(typingEntryId);
    }
  }, [typingEntryId, markComplete]);

  const isEntryComplete = useCallback((id: string) => {
    return completedEntries.has(id);
  }, [completedEntries]);

  const isEntryTyping = useCallback((id: string) => {
    return typingEntryId === id;
  }, [typingEntryId]);

  return {
    typingEntryId,
    isEntryComplete,
    isEntryTyping,
    markComplete,
    skipCurrent,
    speed,
  };
}
