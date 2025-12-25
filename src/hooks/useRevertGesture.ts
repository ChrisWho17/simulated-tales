import { useRef, useCallback, useState, useEffect } from 'react';

export interface RevertGestureState {
  isActive: boolean;
  isDragging: boolean;
  selectedIndex: number | null;
  startY: number;
  currentY: number;
}

export interface UseRevertGestureOptions {
  onRevert: (index: number) => void;
  itemCount: number;
  itemHeight?: number; // Approximate height of each story entry
  minIndex?: number; // Minimum index that can be selected (default 1 to skip first entry)
}

export function useRevertGesture({
  onRevert,
  itemCount,
  itemHeight = 120,
  minIndex = 1,
}: UseRevertGestureOptions) {
  const [state, setState] = useState<RevertGestureState>({
    isActive: false,
    isDragging: false,
    selectedIndex: null,
    startY: 0,
    currentY: 0,
  });

  const lastTapTime = useRef<number>(0);
  const lastTapIndex = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const entriesRef = useRef<Map<number, HTMLElement>>(new Map());

  // Double tap detection threshold (ms)
  const DOUBLE_TAP_THRESHOLD = 300;
  // Hold duration to activate (ms)
  const HOLD_DURATION = 400;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  // Register an entry element
  const registerEntry = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      entriesRef.current.set(index, element);
    } else {
      entriesRef.current.delete(index);
    }
  }, []);

  // Find which entry is at a given Y coordinate
  const findEntryAtY = useCallback((y: number): number | null => {
    for (const [index, element] of entriesRef.current.entries()) {
      const rect = element.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        return index;
      }
    }
    return null;
  }, []);

  // Handle touch/pointer start
  const handlePointerDown = useCallback((index: number, y: number) => {
    if (index < minIndex) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    const sameEntry = lastTapIndex.current === index;

    // Check if this is a double tap on the same entry
    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && sameEntry) {
      // Double tap detected - start hold timer
      clearTimers();
      
      holdTimer.current = setTimeout(() => {
        // Activate gesture mode
        setState({
          isActive: true,
          isDragging: true,
          selectedIndex: index,
          startY: y,
          currentY: y,
        });

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([30, 50, 30]);
        }
      }, HOLD_DURATION);

      // Reset tap tracking
      lastTapTime.current = 0;
      lastTapIndex.current = null;
    } else {
      // First tap - record time and position
      lastTapTime.current = now;
      lastTapIndex.current = index;
    }
  }, [minIndex, clearTimers]);

  // Handle touch/pointer move
  const handlePointerMove = useCallback((y: number) => {
    if (!state.isDragging) return;

    setState(prev => ({ ...prev, currentY: y }));

    // Find entry at current Y position
    const entryIndex = findEntryAtY(y);
    if (entryIndex !== null && entryIndex >= minIndex && entryIndex !== state.selectedIndex) {
      setState(prev => ({ ...prev, selectedIndex: entryIndex }));
      // Light haptic on selection change
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }, [state.isDragging, state.selectedIndex, findEntryAtY, minIndex]);

  // Handle touch/pointer end
  const handlePointerUp = useCallback(() => {
    clearTimers();

    if (state.isDragging && state.selectedIndex !== null) {
      // Trigger revert
      onRevert(state.selectedIndex);
      // Strong haptic on confirm
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    setState({
      isActive: false,
      isDragging: false,
      selectedIndex: null,
      startY: 0,
      currentY: 0,
    });
  }, [state.isDragging, state.selectedIndex, onRevert, clearTimers]);

  // Cancel gesture
  const cancelGesture = useCallback(() => {
    clearTimers();
    setState({
      isActive: false,
      isDragging: false,
      selectedIndex: null,
      startY: 0,
      currentY: 0,
    });
    lastTapTime.current = 0;
    lastTapIndex.current = null;
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Global pointer event listeners when active
  useEffect(() => {
    if (!state.isDragging) return;

    const handleMove = (e: PointerEvent | TouchEvent) => {
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      handlePointerMove(y);
    };

    const handleUp = () => {
      handlePointerUp();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', cancelGesture);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', cancelGesture);
    };
  }, [state.isDragging, handlePointerMove, handlePointerUp, cancelGesture]);

  return {
    state,
    registerEntry,
    handlePointerDown,
    cancelGesture,
    containerRef,
  };
}
