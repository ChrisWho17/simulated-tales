// Ambient Feed - Connected to NPC chatter and micro-event systems
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  getAmbientFeed as getChatterFeed, 
  ChatterBeat 
} from '@/game/npcChatterSystem';
import { MICRO_EVENT_TEMPLATES } from '@/game/microEventSystem';

// Ambient entry type
export interface AmbientEntry {
  id: string;
  text: string;
  type: 'micro_event' | 'chatter';
  category?: string;
  timestamp: number;
  involvedNPCs?: string[];
  containsHook?: boolean;
}

interface AmbientFeedProps {
  className?: string;
  maxVisible?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  autoHide?: boolean;
  autoHideDelay?: number;
  // External entries can be passed in
  externalEntries?: AmbientEntry[];
  // Micro-event settings
  enableMicroEvents?: boolean;
  microEventChance?: number;
}

export function AmbientFeed({
  className,
  maxVisible = 3,
  position = 'bottom-left',
  autoHide = true,
  autoHideDelay = 10000,
  externalEntries = [],
  enableMicroEvents = true,
  microEventChance = 0.12,
}: AmbientFeedProps) {
  const [internalEntries, setInternalEntries] = useState<AmbientEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const lastSyncRef = React.useRef<number>(0);
  const lastMicroEventRef = React.useRef<number>(0);

  // Sync with chatter system periodically
  const syncChatterFeed = useCallback(() => {
    const now = Date.now();
    // Only sync every 5 seconds to avoid excessive processing
    if (now - lastSyncRef.current < 5000) return;
    lastSyncRef.current = now;

    const chatterBeats = getChatterFeed();
    if (chatterBeats.length === 0) return;

    setInternalEntries(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newEntries: AmbientEntry[] = [];

      chatterBeats.forEach((beat: ChatterBeat) => {
        if (!existingIds.has(beat.id)) {
          newEntries.push({
            id: beat.id,
            text: beat.text,
            type: 'chatter',
            category: beat.topic,
            timestamp: beat.timestamp,
            involvedNPCs: beat.involvedNPCs,
            containsHook: beat.containsHook,
          });
        }
      });

      if (newEntries.length === 0) return prev;

      const updated = [...prev, ...newEntries];
      // Keep only last 10 entries
      return updated.slice(-10);
    });
  }, []);

  // Maybe trigger a micro-event
  const maybeTriggerMicroEvent = useCallback(() => {
    if (!enableMicroEvents) return;
    
    const now = Date.now();
    // At least 45 seconds between micro-events
    if (now - lastMicroEventRef.current < 45000) return;
    
    // Random chance
    if (Math.random() > microEventChance) return;

    // Pick a random micro-event
    const validEvents = MICRO_EVENT_TEMPLATES.filter(e => {
      // Skip events with complex conditions for ambient display
      if (e.conditions?.minTurns && e.conditions.minTurns > 10) return false;
      return true;
    });

    if (validEvents.length === 0) return;

    // Weighted random selection
    const totalWeight = validEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedEvent = validEvents[0];
    for (const event of validEvents) {
      random -= event.weight;
      if (random <= 0) {
        selectedEvent = event;
        break;
      }
    }

    const entry: AmbientEntry = {
      id: `micro_${selectedEvent.id}_${now}`,
      text: selectedEvent.description,
      type: 'micro_event',
      category: selectedEvent.category,
      timestamp: now,
      containsHook: !!selectedEvent.followUp,
    };

    setInternalEntries(prev => [...prev.slice(-9), entry]);
    lastMicroEventRef.current = now;
  }, [enableMicroEvents, microEventChance]);

  // Periodic sync and micro-event check
  useEffect(() => {
    const interval = setInterval(() => {
      syncChatterFeed();
      maybeTriggerMicroEvent();
    }, 8000);

    return () => clearInterval(interval);
  }, [syncChatterFeed, maybeTriggerMicroEvent]);

  // Cleanup old entries
  useEffect(() => {
    const cleanup = setInterval(() => {
      const fadeTime = 90000; // 1.5 minutes
      const now = Date.now();
      setInternalEntries(prev => prev.filter(entry => now - entry.timestamp < fadeTime));
    }, 15000);

    return () => clearInterval(cleanup);
  }, []);

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

  // Combine internal and external entries
  const allEntries = [...internalEntries, ...externalEntries]
    .sort((a, b) => a.timestamp - b.timestamp);

  const positionClasses = {
    'bottom-left': 'bottom-20 left-4',
    'bottom-right': 'bottom-20 right-4',
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
  };

  const visibleEntries = allEntries.slice(-maxVisible);

  // Don't render if no entries and collapsed
  if (allEntries.length === 0 && collapsed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-40 pointer-events-none hidden md:block',
        positionClasses[position],
        className
      )}
      onMouseEnter={() => {
        setLastInteraction(Date.now());
        setCollapsed(false);
      }}
    >
      {/* Toggle button */}
      {allEntries.length > 0 && (
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
      )}

      {/* Feed container */}
      <AnimatePresence>
        {!collapsed && visibleEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-2 max-w-xs pointer-events-auto"
          >
            <AnimatePresence mode="popLayout">
              {visibleEntries.map((entry) => (
                <AmbientEntryItem key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AmbientEntryItemProps {
  entry: AmbientEntry;
}

function AmbientEntryItem({ entry }: AmbientEntryItemProps) {
  const isChatter = entry.type === 'chatter';
  const age = Date.now() - entry.timestamp;
  const fadeStart = 20000;
  const fadeEnd = 60000;
  const opacity = age < fadeStart ? 1 : Math.max(0.4, 1 - (age - fadeStart) / (fadeEnd - fadeStart));

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

      <p className="text-xs text-foreground/80 leading-relaxed">
        {entry.text}
      </p>

      {isChatter && entry.involvedNPCs && entry.involvedNPCs.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/50 italic">
            — {entry.involvedNPCs.join(' & ')}
          </span>
        </div>
      )}

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
