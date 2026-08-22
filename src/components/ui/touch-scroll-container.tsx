// ============================================================================
// TOUCH SCROLL CONTAINER - Native mobile scrolling, desktop rail only
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

interface ScrollInfo {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
  );
}

export function TouchScrollContainer({
  children,
  className,
  contentClassName,
  showScrollButtons = true,
}: TouchScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(pointer: coarse)');
    const sync = () => setCoarsePointer(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  const updateScrollInfo = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const next: ScrollInfo = {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
    };
    setScrollInfo((previous) => (
      previous.scrollTop === next.scrollTop &&
      previous.scrollHeight === next.scrollHeight &&
      previous.clientHeight === next.clientHeight
        ? previous
        : next
    ));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = (event: FocusEvent) => {
      if (isEditableTarget(event.target)) editingRef.current = true;
    };
    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        editingRef.current = Boolean(active && container.contains(active) && isEditableTarget(active));
        if (!editingRef.current) updateScrollInfo();
      }, 0);
    };
    const handleResize = () => {
      // Opening/closing a mobile keyboard resizes the viewport. Rebuilding a
      // custom scrollbar during that resize can steal focus on Samsung/Chrome.
      if (!editingRef.current) updateScrollInfo();
    };

    container.addEventListener('scroll', updateScrollInfo, { passive: true });
    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    updateScrollInfo();

    return () => {
      container.removeEventListener('scroll', updateScrollInfo);
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
      resizeObserver.disconnect();
    };
  }, [updateScrollInfo]);

  const canScroll = scrollInfo.scrollHeight > scrollInfo.clientHeight + 1;
  const showDesktopRail = canScroll && !coarsePointer;
  const thumbHeight = showDesktopRail
    ? Math.max(40, (scrollInfo.clientHeight / scrollInfo.scrollHeight) * scrollInfo.clientHeight)
    : 0;
  const thumbTop = showDesktopRail
    ? (scrollInfo.scrollTop / Math.max(1, scrollInfo.scrollHeight - scrollInfo.clientHeight)) *
      Math.max(0, scrollInfo.clientHeight - thumbHeight)
    : 0;

  const scrollBy = useCallback((amount: number) => {
    containerRef.current?.scrollBy({ top: amount, behavior: 'smooth' });
  }, []);

  const setScrollFromPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !showDesktopRail) return;
    event.preventDefault();
    const track = event.currentTarget;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
    container.scrollTop = ratio * Math.max(0, container.scrollHeight - container.clientHeight);
  }, [showDesktopRail]);

  const canScrollUp = scrollInfo.scrollTop > 0;
  const canScrollDown = scrollInfo.scrollTop < scrollInfo.scrollHeight - scrollInfo.clientHeight - 1;

  return (
    <div className={cn('relative flex min-w-0', className)}>
      <div
        ref={containerRef}
        className={cn(
          'flex-1 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain',
          // Mobile companion/options grids must never force nowrap overflow.
          '[&_.grid]:min-w-0 [&_.grid>*]:min-w-0',
          '[&_button]:min-w-0 max-md:[&_button]:whitespace-normal max-md:[&_button]:break-words',
          contentClassName,
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          scrollbarWidth: showDesktopRail ? 'none' : 'auto',
          msOverflowStyle: showDesktopRail ? 'none' : 'auto',
        }}
      >
        {children}
      </div>

      {showDesktopRail && (
        <div className="w-6 shrink-0 flex flex-col items-center py-1 bg-muted/20 border-l border-border/30">
          {showScrollButtons && (
            <button
              type="button"
              onClick={() => scrollBy(-100)}
              disabled={!canScrollUp}
              className={cn(
                'p-1 rounded transition-colors',
                canScrollUp ? 'text-primary hover:bg-primary/20 active:bg-primary/30' : 'text-muted-foreground/30',
              )}
              aria-label="Scroll up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          <div
            className="flex-1 w-3 relative my-1 cursor-pointer"
            onPointerDown={setScrollFromPointer}
          >
            <div className="absolute inset-0 rounded-full bg-muted/30" />
            <div
              className="absolute left-0 right-0 rounded-full bg-primary/60"
              style={{ top: thumbTop, height: thumbHeight }}
            />
          </div>

          {showScrollButtons && (
            <button
              type="button"
              onClick={() => scrollBy(100)}
              disabled={!canScrollDown}
              className={cn(
                'p-1 rounded transition-colors',
                canScrollDown ? 'text-primary hover:bg-primary/20 active:bg-primary/30' : 'text-muted-foreground/30',
              )}
              aria-label="Scroll down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
