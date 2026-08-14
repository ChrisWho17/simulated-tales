import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { DM_FULL_CONTROL_EXPLANATION } from '@/game/directorModeSystem';

interface DmFullControlBadgeProps {
  active: boolean;
  className?: string;
}

/**
 * Visible "DM Full Control Active" indicator shown during gameplay.
 * Tapping it reveals the short explanation of what the mode does.
 */
export const DmFullControlBadge: React.FC<DmFullControlBadgeProps> = ({ active, className }) => {
  const [open, setOpen] = useState(false);
  if (!active) return null;

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="DM Full Control Active — what does this mean?"
        className="flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/15 px-2.5 py-1 text-[10px] font-medium text-foreground backdrop-blur-md transition-colors hover:bg-[var(--accent-primary)]/25"
      >
        <Shield className="h-3 w-3 text-[var(--accent-primary)]" />
        <span className="whitespace-nowrap">DM Full Control Active</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 max-w-[80vw] rounded-lg border border-border/40 bg-background/95 p-3 text-[11px] leading-relaxed text-muted-foreground shadow-lg backdrop-blur-md [overflow-wrap:anywhere]">
          {DM_FULL_CONTROL_EXPLANATION}
        </div>
      )}
    </div>
  );
};

export default DmFullControlBadge;
