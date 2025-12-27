import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { getUnifiedAmbientFeed, UnifiedAmbientEntry } from '@/game/unifiedAmbientSystem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AmbientFeedProps {
  className?: string;
  maxVisible?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function AmbientFeed({
  className,
  maxVisible = 3,
  position = 'bottom-left',
  autoHide = true,
  autoHideDelay = 8000,
}: AmbientFeedProps) {
  const [entries, setEntries] = useState<UnifiedAmbientEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Poll for new entries
  useEffect(() => {
    const interval = setInterval(() => {
      const feed = getUnifiedAmbientFeed();
      setEntries(feed.slice(-maxVisible * 2)); // Keep some buffer
    }, 1000);

    return () => clearInterval(interval);
  }, [maxVisible]);

  // Auto-hide after inactivity
  useEffect(() => {
    if (!autoHide || collapsed) return;

    const timeout = setTimeout(() => {
      if (Date.now() - lastInteraction > autoHideDelay) {
        setCollapsed(true);
      }
    }, autoHideDelay);

    return () => clearTimeout(timeout);
  }, [lastInteraction, autoHide, autoHideDelay, collapsed]);

  // Update last interaction when new entries arrive
  useEffect(() => {
    if (entries.length > 0) {
      setLastInteraction(Date.now());
      if (collapsed && entries.length > 0) {
        // Show briefly when new content arrives
        setCollapsed(false);
      }
    }
  }, [entries.length]);

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  const visibleEntries = entries.slice(-maxVisible);

  if (entries.length === 0 && collapsed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-40 pointer-events-none',
        positionClasses[position],
        className
      )}
      onMouseEnter={() => setLastInteraction(Date.now())}
    >
      {/* Toggle button */}
      <div className="pointer-events-auto mb-2 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-background/60 backdrop-blur-sm hover:bg-background/80"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <Eye className="h-3 w-3 text-muted-foreground" />
          ) : (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Feed container */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-2 max-w-xs pointer-events-auto"
          >
            <AnimatePresence mode="popLayout">
              {visibleEntries.map((entry) => (
                <AmbientEntry key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AmbientEntryProps {
  entry: UnifiedAmbientEntry;
}

function AmbientEntry({ entry }: AmbientEntryProps) {
  const isChatter = entry.type === 'chatter';
  const age = Date.now() - entry.timestamp;
  const fadeStart = 15000; // Start fading at 15s
  const fadeEnd = 30000; // Fully faded at 30s
  const opacity = age < fadeStart ? 1 : Math.max(0.3, 1 - (age - fadeStart) / (fadeEnd - fadeStart));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'rounded-lg px-3 py-2 backdrop-blur-md border shadow-lg',
        isChatter
          ? 'bg-primary/10 border-primary/20'
          : 'bg-secondary/10 border-secondary/20'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1">
        {isChatter ? (
          <MessageCircle className="h-3 w-3 text-primary/70" />
        ) : (
          <Sparkles className="h-3 w-3 text-secondary/70" />
        )}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          {isChatter ? 'Nearby' : entry.category || 'World'}
        </span>
      </div>

      {/* Content */}
      <p className="text-xs text-foreground/80 leading-relaxed">
        {entry.text}
      </p>

      {/* Speaker info for chatter */}
      {isChatter && entry.involvedNPCs && entry.involvedNPCs.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/50 italic">
            — {entry.involvedNPCs.join(' & ')}
          </span>
        </div>
      )}

      {/* Hook indicator for micro-events */}
      {!isChatter && entry.containsHook && (
        <div className="mt-1.5 pt-1.5 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/60 italic">
            Something to investigate...
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default AmbientFeed;
