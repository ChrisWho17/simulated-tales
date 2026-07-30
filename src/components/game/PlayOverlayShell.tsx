import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlayOverlaySize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<PlayOverlaySize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export interface PlayOverlayShellProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** Small line under the title — character subtitle, item count, etc. */
  subtitle?: React.ReactNode;
  /** Rendered left of the title. Keep to a single icon. */
  icon?: React.ReactNode;
  /** Extra controls rendered to the left of the close button. */
  headerActions?: React.ReactNode;
  /** Rendered between header and body, outside the scroll container (tab rails, search). */
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: PlayOverlaySize;
  /** Stacked overlays (level-up over the sheet) need to sit above the base layer. */
  zIndex?: number;
  /** Disable click-outside dismissal for destructive or in-progress flows. */
  dismissOnBackdrop?: boolean;
  className?: string;
  bodyClassName?: string;
  'aria-label'?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared chrome for in-play overlays (settings, character sheet, inventory, companions).
 *
 * One composition per overlay: a single atmospheric surface holds header, body and footer
 * rather than stacking cards. Cards inside the body are reserved for interactive rows.
 */
export const PlayOverlayShell: React.FC<PlayOverlayShellProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  headerActions,
  toolbar,
  footer,
  children,
  size = 'md',
  zIndex = 50,
  dismissOnBackdrop = true,
  className,
  bodyClassName,
  'aria-label': ariaLabel,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !surfaceRef.current) return;

      const focusable = Array.from(
        surfaceRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(el => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', handleKeyDown, true);

    // Background scroll would otherwise bleed through the full-screen mobile layout.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const target = surfaceRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          onMouseDown={dismissOnBackdrop ? onClose : undefined}
        >
          <div className="play-overlay-backdrop absolute inset-0" aria-hidden="true" />

          <motion.div
            ref={surfaceRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
            className={cn(
              'play-overlay-surface relative flex w-full flex-col overflow-hidden',
              'h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl',
              SIZE_CLASS[size],
              className
            )}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={e => e.stopPropagation()}
          >
            <header className="play-overlay-header flex flex-shrink-0 items-center gap-3 px-4 py-3 sm:px-5">
              {icon && (
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-[var(--accent-primary)]">
                  {icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="play-overlay-title truncate">{title}</h2>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="play-overlay-close flex-shrink-0"
              >
                <X size={18} />
              </button>
            </header>

            {toolbar && <div className="flex-shrink-0">{toolbar}</div>}

            <div
              className={cn(
                'play-overlay-body min-h-0 flex-1 overflow-y-auto overscroll-contain',
                bodyClassName
              )}
            >
              {children}
            </div>

            {footer && (
              <div className="play-overlay-footer flex-shrink-0 px-4 py-3 sm:px-5">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
};

export default PlayOverlayShell;
