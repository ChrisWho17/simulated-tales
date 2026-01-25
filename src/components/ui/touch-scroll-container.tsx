// ============================================================================
// TOUCH SCROLL CONTAINER - Scrollable with visible slider and drag support
// ============================================================================

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TouchScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showScrollButtons?: boolean;
}

export function TouchScrollContainer({
  children,
  className,
  contentClassName,
  showScrollButtons = true,
}: TouchScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, scrollTop: 0 });
  const thumbDragStartRef = useRef({ y: 0, scrollTop: 0 });

  // Update scroll info
  const updateScrollInfo = useCallback(() => {
    if (containerRef.current) {
      setScrollInfo({
        scrollTop: containerRef.current.scrollTop,
        scrollHeight: containerRef.current.scrollHeight,
        clientHeight: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateScrollInfo();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollInfo);
      const resizeObserver = new ResizeObserver(updateScrollInfo);
      resizeObserver.observe(container);
      return () => {
        container.removeEventListener('scroll', updateScrollInfo);
        resizeObserver.disconnect();
      };
    }
  }, [updateScrollInfo]);

  // Calculate thumb position and size
  const canScroll = scrollInfo.scrollHeight > scrollInfo.clientHeight;
  const thumbHeight = canScroll
    ? Math.max(40, (scrollInfo.clientHeight / scrollInfo.scrollHeight) * scrollInfo.clientHeight)
    : 0;
  const thumbTop = canScroll
    ? (scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight)) *
      (scrollInfo.clientHeight - thumbHeight)
    : 0;

  // Drag-to-scroll (content dragging)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, [role="button"], [data-radix-collection-item]')) {
      return;
    }
    
    setIsDragging(true);
    dragStartRef.current = {
      y: e.clientY,
      scrollTop: containerRef.current?.scrollTop || 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const deltaY = dragStartRef.current.y - e.clientY;
    containerRef.current.scrollTop = dragStartRef.current.scrollTop + deltaY;
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Thumb dragging
  const handleThumbPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsThumbDragging(true);
    thumbDragStartRef.current = {
      y: e.clientY,
      scrollTop: containerRef.current?.scrollTop || 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleThumbPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isThumbDragging || !containerRef.current) return;
    
    const deltaY = e.clientY - thumbDragStartRef.current.y;
    const scrollRatio = (scrollInfo.scrollHeight - scrollInfo.clientHeight) / (scrollInfo.clientHeight - thumbHeight);
    containerRef.current.scrollTop = thumbDragStartRef.current.scrollTop + deltaY * scrollRatio;
  }, [isThumbDragging, scrollInfo, thumbHeight]);

  const handleThumbPointerUp = useCallback((e: React.PointerEvent) => {
    setIsThumbDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Scroll buttons
  const scrollBy = useCallback((amount: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  }, []);

  const canScrollUp = scrollInfo.scrollTop > 0;
  const canScrollDown = scrollInfo.scrollTop < scrollInfo.scrollHeight - scrollInfo.clientHeight - 1;

  return (
    <div className={cn("relative flex", className)}>
      {/* Scrollable content area */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "scrollbar-none", // Hide native scrollbar
          isDragging && "cursor-grabbing select-none",
          !isDragging && "cursor-grab",
          contentClassName
        )}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>

      {/* Custom scrollbar track */}
      {canScroll && (
        <div className="w-6 flex flex-col items-center py-1 bg-muted/20 border-l border-border/30">
          {/* Scroll up button */}
          {showScrollButtons && (
            <button
              onClick={() => scrollBy(-100)}
              disabled={!canScrollUp}
              className={cn(
                "p-1 rounded transition-colors",
                canScrollUp 
                  ? "text-primary hover:bg-primary/20 active:bg-primary/30" 
                  : "text-muted-foreground/30"
              )}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {/* Track */}
          <div className="flex-1 w-3 relative my-1">
            <div className="absolute inset-0 rounded-full bg-muted/30" />
            
            {/* Thumb */}
            <div
              ref={thumbRef}
              className={cn(
                "absolute left-0 right-0 rounded-full cursor-pointer transition-colors",
                isThumbDragging 
                  ? "bg-primary" 
                  : "bg-primary/60 hover:bg-primary/80"
              )}
              style={{
                top: thumbTop,
                height: thumbHeight,
              }}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
            />
          </div>

          {/* Scroll down button */}
          {showScrollButtons && (
            <button
              onClick={() => scrollBy(100)}
              disabled={!canScrollDown}
              className={cn(
                "p-1 rounded transition-colors",
                canScrollDown 
                  ? "text-primary hover:bg-primary/20 active:bg-primary/30" 
                  : "text-muted-foreground/30"
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
