import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, HeartPulse, Users, X, ChevronRight, Scroll, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanionState, companionSystem } from '@/game/companionSystem';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import {
  PendingCompanionWithTiming,
  AppearanceTimingType,
  getPendingIntroductions,
  savePendingIntroductions,
  getNextReadyCompanion,
  shouldCompanionAppearNow,
} from '@/game/companionTimingSystem';

// Pending introduction from localStorage (now includes timing)
export interface PendingCompanionIntroduction extends PendingCompanionWithTiming {}

// Pending resurrection from localStorage
export interface PendingResurrectionEvent {
  companionId: string;
  storyIntro: string;
  timestamp: number;
}

interface CompanionStoryEventProps {
  event: PendingCompanionIntroduction | PendingResurrectionEvent;
  type: 'introduction' | 'resurrection';
  onDismiss: () => void;
  onInjectToStory?: (text: string) => void;
}

/**
 * Displays a dramatic companion story event (introduction or resurrection)
 */
export function CompanionStoryEvent({
  event,
  type,
  onDismiss,
  onInjectToStory,
}: CompanionStoryEventProps) {
  const isIntroduction = type === 'introduction';
  const intro = isIntroduction ? (event as PendingCompanionIntroduction) : null;
  const resurrection = !isIntroduction ? (event as PendingResurrectionEvent) : null;
  
  const storyText = isIntroduction ? intro!.introduction : resurrection!.storyIntro;
  const companionName = isIntroduction ? intro!.name : (() => {
    const companion = companionSystem.getCompanion(resurrection!.companionId);
    return companion?.name || 'Unknown';
  })();
  const portraitUrl = isIntroduction ? intro!.portraitUrl : null;
  
  const handleAddToStory = () => {
    if (onInjectToStory) {
      onInjectToStory(storyText);
    }
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        "relative rounded-xl border backdrop-blur-md overflow-hidden",
        isIntroduction 
          ? "bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border-primary/30"
          : "bg-gradient-to-br from-green-500/10 via-background to-emerald-500/10 border-green-500/30"
      )}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-xl" />
      
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isIntroduction ? "border-primary/20 bg-primary/5" : "border-green-500/20 bg-green-500/5"
      )}>
        <div className="flex items-center gap-2">
          {isIntroduction ? (
            <>
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">New Companion Arrives</span>
            </>
          ) : (
            <>
              <HeartPulse className="w-5 h-5 text-green-400" />
              <span className="font-medium text-sm text-green-400">Miraculous Revival</span>
            </>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7" 
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Portrait & Name */}
        <div className="flex items-start gap-4">
          {portraitUrl && (
            <div className="w-20 h-24 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
              <img 
                src={portraitUrl} 
                alt={companionName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              {companionName}
            </h3>
            {isIntroduction && intro?.origin && (
              <p className="text-xs text-muted-foreground capitalize mt-1">
                Origin: {intro.origin.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        </div>
        
        {/* Story Text */}
        <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-start gap-2 mb-2">
            <Scroll className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Story Event</span>
          </div>
          <p className="text-sm leading-relaxed italic font-narrative text-foreground/90">
            {storyText}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button 
            size="sm" 
            className={cn(
              "flex-1",
              isIntroduction 
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-gradient-to-r from-green-600 to-emerald-600"
            )}
            onClick={handleAddToStory}
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            Add to Story
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hook to manage and display pending companion story events
 */
export function useCompanionStoryEvents() {
  const [pendingIntroductions, setPendingIntroductions] = useState<PendingCompanionIntroduction[]>([]);
  const [pendingResurrections, setPendingResurrections] = useState<PendingResurrectionEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<{
    event: PendingCompanionIntroduction | PendingResurrectionEvent;
    type: 'introduction' | 'resurrection';
  } | null>(null);

  // Load events from localStorage
  const loadEvents = useCallback(() => {
    try {
      const intros = getPendingIntroductions();
      const undisplayedIntros = intros.filter((i: PendingCompanionIntroduction) => !i.displayed);
      setPendingIntroductions(undisplayedIntros);
      
      const resurrections = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_RESURRECTION_EVENTS) || '[]');
      setPendingResurrections(resurrections);
    } catch (e) {
      console.error('Failed to load companion events:', e);
    }
  }, []);

  // Check for new events periodically
  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  // Show the next pending event (respects timing)
  const showNextEvent = useCallback((context?: { 
    turnNumber?: number; 
    isNewScene?: boolean;
    justFinishedCombat?: boolean;
    justRested?: boolean;
    locationChanged?: boolean;
  }) => {
    // Prioritize resurrections (more dramatic)
    if (pendingResurrections.length > 0) {
      setCurrentEvent({ event: pendingResurrections[0], type: 'resurrection' });
      return true;
    }
    
    // For introductions, check timing if context provided
    if (pendingIntroductions.length > 0) {
      if (context) {
        const ready = getNextReadyCompanion({
          turnNumber: context.turnNumber || 0,
          isNewScene: context.isNewScene,
          justFinishedCombat: context.justFinishedCombat,
          justRested: context.justRested,
          locationChanged: context.locationChanged,
        });
        if (ready) {
          setCurrentEvent({ event: ready, type: 'introduction' });
          return true;
        }
      } else {
        // No context = show first undisplayed (legacy behavior, for manual trigger)
        setCurrentEvent({ event: pendingIntroductions[0], type: 'introduction' });
        return true;
      }
    }
    
    return false;
  }, [pendingIntroductions, pendingResurrections]);

  // Dismiss the current event
  const dismissEvent = useCallback(() => {
    if (!currentEvent) return;
    
    try {
      if (currentEvent.type === 'introduction') {
        const intro = currentEvent.event as PendingCompanionIntroduction;
        const stored = getPendingIntroductions();
        const updated = stored.map((i: PendingCompanionIntroduction) =>
          i.companionId === intro.companionId ? { ...i, displayed: true } : i
        );
        savePendingIntroductions(updated);
      } else {
        const resurrection = currentEvent.event as PendingResurrectionEvent;
        const stored = JSON.parse(localStorage.getItem('pending-resurrection-events') || '[]');
        const updated = stored.filter((r: PendingResurrectionEvent) => 
          r.companionId !== resurrection.companionId || r.timestamp !== resurrection.timestamp
        );
        localStorage.setItem('pending-resurrection-events', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to dismiss companion event:', e);
    }
    
    setCurrentEvent(null);
    loadEvents();
  }, [currentEvent, loadEvents]);

  const hasEvents = pendingIntroductions.length > 0 || pendingResurrections.length > 0;
  const eventCount = pendingIntroductions.length + pendingResurrections.length;

  return {
    currentEvent,
    showNextEvent,
    dismissEvent,
    hasEvents,
    eventCount,
    pendingIntroductions,
    pendingResurrections,
  };
}

/**
 * Floating notification badge for pending companion events
 */
interface CompanionEventBadgeProps {
  count: number;
  onClick: () => void;
}

export function CompanionEventBadge({ count, onClick }: CompanionEventBadgeProps) {
  if (count === 0) return null;
  
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-40",
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-gradient-to-r from-primary to-amber-500 text-white",
        "shadow-lg shadow-primary/30",
        "animate-pulse"
      )}
    >
      <Users className="w-4 h-4" />
      <span className="text-sm font-medium">{count} Companion Event{count > 1 ? 's' : ''}</span>
      <Sparkles className="w-4 h-4" />
    </motion.button>
  );
}

/**
 * Container component for displaying companion story events in the game
 */
interface CompanionStoryEventsContainerProps {
  onInjectToStory?: (text: string) => void;
}

export function CompanionStoryEventsContainer({ onInjectToStory }: CompanionStoryEventsContainerProps) {
  const { 
    currentEvent, 
    showNextEvent, 
    dismissEvent, 
    hasEvents, 
    eventCount 
  } = useCompanionStoryEvents();

  return (
    <>
      {/* Floating badge when there are pending events */}
      <AnimatePresence>
        {hasEvents && !currentEvent && (
          <CompanionEventBadge count={eventCount} onClick={showNextEvent} />
        )}
      </AnimatePresence>
      
      {/* Modal for current event */}
      <AnimatePresence>
        {currentEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && dismissEvent()}
          >
            <div className="w-full max-w-lg">
              <CompanionStoryEvent
                event={currentEvent.event}
                type={currentEvent.type}
                onDismiss={dismissEvent}
                onInjectToStory={onInjectToStory}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
