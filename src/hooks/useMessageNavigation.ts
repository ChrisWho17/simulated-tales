import { useRef, useCallback, useState, useEffect } from 'react';

// Message navigation hook for scroll-to-message functionality
export interface MessageRef {
  element: HTMLDivElement | null;
  turnId?: number;
}

export function useMessageNavigation() {
  const messageRefs = useRef<Map<string, MessageRef>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Register a message element
  const registerMessage = useCallback((messageId: string, element: HTMLDivElement | null, turnId?: number) => {
    if (element) {
      messageRefs.current.set(messageId, { element, turnId });
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

  // Set container ref for scroll operations
  const setContainer = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
  }, []);

  // Scroll to a specific message by ID
  const scrollToMessage = useCallback((messageId: string) => {
    const ref = messageRefs.current.get(messageId);
    if (!ref?.element) {
      console.warn(`Message with ID ${messageId} not found`);
      return false;
    }

    // Scroll the message into view
    ref.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Highlight the message
    setHighlightedMessageId(messageId);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3000);

    return true;
  }, []);

  // Scroll to a message by turn ID (fallback if messageId not found)
  const scrollToTurn = useCallback((turnId: number) => {
    for (const [messageId, ref] of messageRefs.current.entries()) {
      if (ref.turnId === turnId && ref.element) {
        return scrollToMessage(messageId);
      }
    }
    console.warn(`Message at turn ${turnId} not found`);
    return false;
  }, [scrollToMessage]);

  // Scroll to the latest message
  const scrollToLatest = useCallback(() => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  // Get the last message ID
  const getLastMessageId = useCallback((): string | null => {
    const entries = Array.from(messageRefs.current.entries());
    if (entries.length === 0) return null;
    return entries[entries.length - 1][0];
  }, []);

  // Clear highlight manually
  const clearHighlight = useCallback(() => {
    setHighlightedMessageId(null);
  }, []);

  return {
    registerMessage,
    setContainer,
    scrollToMessage,
    scrollToTurn,
    scrollToLatest,
    getLastMessageId,
    highlightedMessageId,
    clearHighlight,
    containerRef,
  };
}

// Type for the context value
export type MessageNavigationContextValue = ReturnType<typeof useMessageNavigation>;
