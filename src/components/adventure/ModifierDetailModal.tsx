import { useState } from 'react';
import { Modifier, ModifierOccurredAt, ModifierTriggerEvent, ModifierLocation, ModifierOriginMessage, ModifierOriginSnapshot, getModifierEffectPercentage } from '@/game/buffDebuffSystem';
import { Button } from '@/components/ui/button';
import { 
  X, Shield, Zap, Heart, Brain, Thermometer, Dumbbell, Pill, Activity, Eye,
  MapPin, Clock, AlertTriangle, Sparkles, Calendar, Hash, RotateCcw, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModifierDetailModalProps {
  modifier: Modifier;
  onClose: () => void;
  onRewind?: (anchorId: string, turnId: number) => void;
  onJumpToMessage?: (messageId: string, turnId: number) => void;
}

function getCategoryIcon(category: Modifier['category']) {
  switch (category) {
    case 'injury': return Heart;
    case 'fatigue': return Zap;
    case 'nutrition': return Activity;
    case 'morale': return Brain;
    case 'environment': return Thermometer;
    case 'training': return Dumbbell;
    case 'illness': return Pill;
    case 'chemical': return Pill;
    case 'psychological': return Brain;
    case 'phobia': return Eye;
    case 'routine': return Activity;
    default: return Shield;
  }
}

function getModifierColors(modifier: Modifier) {
  if (modifier.category === 'phobia') {
    return {
      bg: 'bg-modifier-neutral/20',
      border: 'border-modifier-neutral/50',
      text: 'text-modifier-neutral',
      glow: 'shadow-modifier-neutral/20',
    };
  }
  if (modifier.type === 'buff') {
    return {
      bg: 'bg-modifier-buff/20',
      border: 'border-modifier-buff/50',
      text: 'text-modifier-buff',
      glow: 'shadow-modifier-buff/20',
    };
  }
  if (modifier.severity >= 0.7) {
    return {
      bg: 'bg-modifier-critical/20',
      border: 'border-modifier-critical/50',
      text: 'text-modifier-critical',
      glow: 'shadow-modifier-critical/20',
    };
  }
  if (modifier.category === 'injury' || modifier.severity >= 0.4) {
    return {
      bg: 'bg-modifier-injury/20',
      border: 'border-modifier-injury/50',
      text: 'text-modifier-injury',
      glow: 'shadow-modifier-injury/20',
    };
  }
  return {
    bg: 'bg-modifier-neutral/20',
    border: 'border-modifier-neutral/50',
    text: 'text-modifier-neutral',
    glow: 'shadow-modifier-neutral/20',
  };
}

// Format duration as turns
function formatDuration(remaining: number, appliedAtTurn?: number): string {
  if (remaining === Infinity) return 'Permanent';
  if (remaining <= 0) return 'Expired';
  if (remaining === 1) return '1 turn remaining';
  return `${Math.round(remaining)} turns remaining`;
}

function getSeverityLabel(severity: number): string {
  if (severity >= 0.8) return 'Critical';
  if (severity >= 0.6) return 'Severe';
  if (severity >= 0.4) return 'Moderate';
  if (severity >= 0.25) return 'Mild';
  return 'Minor';
}

// Format device time to human-readable string
function formatDeviceTime(deviceTime: string): string {
  try {
    const date = new Date(deviceTime);
    if (isNaN(date.getTime())) return 'Time Unknown';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' — ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Time Unknown';
  }
}

// Get the "When" display string - NEVER show "Recently" if we have real data
function getWhenDisplay(modifier: Modifier): { primary: string; secondary?: string } {
  // Priority 1: Use structured occurredAt
  if (modifier.occurredAt?.deviceTime) {
    return {
      primary: formatDeviceTime(modifier.occurredAt.deviceTime),
      secondary: modifier.occurredAt.worldTime !== 'Unknown' 
        ? `In-game: ${modifier.occurredAt.worldTime}` 
        : undefined,
    };
  }
  
  // Priority 2: Use legacy originTimestamp if it looks like a real time
  if (modifier.originTimestamp && modifier.originTimestamp !== 'Recently') {
    return { primary: modifier.originTimestamp };
  }
  
  // Priority 3: Show "Time Unknown" - never "Recently"
  return { primary: 'Time Unknown' };
}

// Get phobia display name (e.g., "Arachnophobia", "Claustrophobia")
function getPhobiaName(modifier: Modifier): string | null {
  // Priority 1: Check trigger event phobia field
  if (modifier.triggerEvent?.phobia) {
    return capitalizeFirst(modifier.triggerEvent.phobia);
  }
  
  // Priority 2: Extract from modifier name
  if (modifier.category === 'phobia') {
    const name = modifier.name.toLowerCase();
    // Common phobia patterns
    const phobiaMap: Record<string, string> = {
      'fear of fire': 'Pyrophobia',
      'fear of storms': 'Astraphobia', 
      'fear of the dead': 'Necrophobia',
      'fear of isolation': 'Autophobia',
      'fear of failure': 'Atychiphobia',
      'fear of heights': 'Acrophobia',
      'fear of spiders': 'Arachnophobia',
      'fear of darkness': 'Nyctophobia',
      'fear of water': 'Aquaphobia',
      'fear of enclosed spaces': 'Claustrophobia',
      'fear of crowds': 'Agoraphobia',
      'fear of blood': 'Hemophobia',
    };
    
    for (const [key, phobiaName] of Object.entries(phobiaMap)) {
      if (name.includes(key)) return phobiaName;
    }
    
    // If already ends in "phobia", use it
    if (name.endsWith('phobia')) {
      return capitalizeFirst(name);
    }
    
    return null;
  }
  
  return null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Title Case utility - enforces consistent capitalization for all labels
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format stimulus for display with proper capitalization
function formatStimulus(stimulus: string): string {
  if (!stimulus) return '';
  // Capitalize first letter and ensure proper sentence case
  const formatted = stimulus.charAt(0).toUpperCase() + stimulus.slice(1);
  return formatted;
}

// Get the "How" display string from trigger event
function getHowDisplay(modifier: Modifier): { 
  source: string; 
  details?: string;
  type?: string;
  phobia?: string;
} | null {
  const phobiaName = getPhobiaName(modifier);
  
  // For phobias, always show the phobia name prominently as the source
  if (modifier.category === 'phobia' || modifier.triggerEvent?.type === 'phobia_trigger') {
    const te = modifier.triggerEvent;
    
    // Build a good source description
    let source = phobiaName 
      ? `${phobiaName} Response Triggered`
      : 'Fear Response Triggered';
    
    // Get details from trigger event or incident
    let details: string | undefined;
    if (te?.details.stimulus) {
      details = `Trigger: ${te.details.stimulus}`;
    } else if (modifier.triggerCause) {
      details = `Trigger: ${modifier.triggerCause}`;
    }
    
    return {
      source,
      details,
      type: 'Psychological Trigger',
      phobia: phobiaName || undefined,
    };
  }
  
  // Priority 1: Use structured triggerEvent
  if (modifier.triggerEvent) {
    const te = modifier.triggerEvent;
    let details: string | undefined;
    
    // Build details string from trigger event details
    const detailParts: string[] = [];
    if (te.details.stimulus) detailParts.push(te.details.stimulus);
    if (te.details.bodyPart) detailParts.push(`Affected: ${te.details.bodyPart}`);
    if (te.details.weapon) detailParts.push(`Weapon: ${te.details.weapon}`);
    if (te.details.action) detailParts.push(te.details.action);
    
    if (detailParts.length > 0) {
      details = detailParts.join(' • ');
    }
    
    return {
      source: te.source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      details,
      type: te.type.replace(/_/g, ' '),
      phobia: phobiaName || te.phobia,
    };
  }
  
  // Priority 2: Use legacy incidentDescription
  if (modifier.incidentDescription) {
    return {
      source: modifier.incidentDescription,
      details: modifier.bodyPart ? `Affected area: ${modifier.bodyPart}` : undefined,
      phobia: phobiaName || undefined,
    };
  }
  
  // Priority 3: Use triggerCause for phobias
  if (modifier.triggerCause) {
    return {
      source: modifier.triggerCause,
      type: 'phobia trigger',
      phobia: phobiaName || undefined,
    };
  }
  
  return null;
}

// Get location display - NEVER show "Unknown Location"
function getLocationDisplay(modifier: Modifier): string | null {
  // Priority 1: Structured location
  if (modifier.location?.name) {
    return modifier.location.name;
  }
  
  // Priority 2: Legacy originLocation (but not "Unknown Location")
  if (modifier.originLocation && modifier.originLocation !== 'Unknown Location') {
    return modifier.originLocation;
  }
  
  return null;
}

// Get incident type label based on modifier category
function getIncidentTypeLabel(modifier: Modifier): string {
  if (modifier.category === 'phobia' || modifier.category === 'psychological') {
    return 'Fear Triggered';
  }
  if (modifier.category === 'injury') {
    return 'Injury Sustained';
  }
  return toTitleCase(modifier.category) + ' Effect';
}

// Get trigger display for the splash - THE THING THAT SCARED/HURT THEM
function getTriggerDisplay(modifier: Modifier): { 
  stimulus: string | null; 
  stimulusType: string | null;
  cause: string | null;
  context: string | null;
} {
  const te = modifier.triggerEvent;
  
  // Priority 1: Structured trigger event stimulus
  if (te?.details.stimulus) {
    return {
      stimulus: formatStimulus(te.details.stimulus),
      stimulusType: te.details.stimulusType ? toTitleCase(te.details.stimulusType) : null,
      cause: te.details.weapon || te.source ? toTitleCase(te.details.weapon || te.source.replace(/_/g, ' ')) : null,
      context: te.details.environmentalContext || null,
    };
  }
  
  // Priority 2: Impact description for injuries
  if (te?.details.impactDescription) {
    return {
      stimulus: formatStimulus(te.details.impactDescription),
      stimulusType: null,
      cause: te.details.impactZone ? `${toTitleCase(te.details.impactZone)}` : null,
      context: te.details.environmentalContext || null,
    };
  }
  
  // Priority 3: Legacy trigger cause
  if (modifier.triggerCause) {
    return {
      stimulus: formatStimulus(modifier.triggerCause),
      stimulusType: null,
      cause: null,
      context: null,
    };
  }
  
  // Priority 4: Incident description
  if (modifier.incidentDescription) {
    return {
      stimulus: formatStimulus(modifier.incidentDescription),
      stimulusType: null,
      cause: null,
      context: null,
    };
  }
  
  return { stimulus: null, stimulusType: null, cause: null, context: null };
}

// Get injury-specific display info
function getInjuryDisplay(modifier: Modifier): {
  injuryType: string | null;
  impactZone: string | null;
} {
  if (modifier.category !== 'injury') return { injuryType: null, impactZone: null };
  
  const te = modifier.triggerEvent;
  return {
    injuryType: te?.details.damageType ? toTitleCase(te.details.damageType) : toTitleCase(modifier.name),
    impactZone: te?.details.impactZone || modifier.bodyPart ? toTitleCase(te?.details.impactZone || modifier.bodyPart || '') : null,
  };
}

// Get a short, declarative trigger reason label (e.g., "Shadows Creeping", "Arachnophobia")
function getTriggerReasonLabel(
  modifier: Modifier, 
  phobiaName: string | null,
  triggerDisplay: { stimulus: string | null; stimulusType: string | null; cause: string | null; context: string | null }
): string {
  // For phobias, prioritize the phobia name
  if (modifier.category === 'phobia' || modifier.category === 'psychological') {
    if (phobiaName) return phobiaName;
    
    // Extract a short label from stimulus
    if (triggerDisplay.stimulus) {
      return extractShortTriggerLabel(triggerDisplay.stimulus);
    }
    
    if (modifier.triggerEvent?.source) {
      return toTitleCase(modifier.triggerEvent.source.replace(/_/g, ' '));
    }
    
    return 'Fear Triggered';
  }
  
  // For injuries, give a short impact description
  if (modifier.category === 'injury') {
    if (modifier.triggerEvent?.details.weapon) {
      return toTitleCase(modifier.triggerEvent.details.weapon);
    }
    if (modifier.triggerEvent?.details.action) {
      return extractShortTriggerLabel(modifier.triggerEvent.details.action);
    }
    if (triggerDisplay.cause) {
      return triggerDisplay.cause;
    }
    return toTitleCase(modifier.name);
  }
  
  // For other categories
  if (triggerDisplay.cause) return triggerDisplay.cause;
  if (modifier.triggerEvent?.source) {
    return toTitleCase(modifier.triggerEvent.source.replace(/_/g, ' '));
  }
  
  return toTitleCase(modifier.category);
}

// Extract a short 2-3 word label from a longer stimulus description
function extractShortTriggerLabel(stimulus: string): string {
  if (!stimulus) return 'Unknown';
  
  // Common fear trigger patterns -> short labels
  const triggerLabels: Record<string, string> = {
    'shadow': 'Shadows Creeping',
    'dark': 'Darkness Encroaching',
    'spider': 'Arachnophobia',
    'height': 'Vertigo',
    'water': 'Deep Waters',
    'fire': 'Flames Rising',
    'blood': 'Blood Sighted',
    'crowd': 'Crowds Pressing',
    'enclosed': 'Walls Closing In',
    'storm': 'Thunder Rolling',
    'dead': 'Death Nearby',
    'alone': 'Isolation',
    'failure': 'Fear of Failure',
  };
  
  const lower = stimulus.toLowerCase();
  for (const [key, label] of Object.entries(triggerLabels)) {
    if (lower.includes(key)) return label;
  }
  
  // Extract first 3 meaningful words
  const words = stimulus.split(' ').filter(w => w.length > 2).slice(0, 3);
  if (words.length > 0) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  
  return 'Triggered';
}

// Get the cause label - what specifically triggered this (people, crowds, enclosed spaces, etc.)
function getCauseLabel(modifier: Modifier, phobiaName: string | null): string {
  // For phobias, identify the fear category
  if (modifier.category === 'phobia' || modifier.category === 'psychological') {
    // Check trigger event for specific cause
    const te = modifier.triggerEvent;
    
    // Map common triggers to cause labels
    const causeMappings: Record<string, string> = {
      'crowd': 'Crowds & People',
      'people': 'Crowds & People',
      'enclosed': 'Enclosed Spaces',
      'claustro': 'Enclosed Spaces',
      'tight': 'Confined Areas',
      'dark': 'Darkness',
      'shadow': 'Shadows & Darkness',
      'height': 'Heights',
      'fall': 'Heights & Falling',
      'spider': 'Spiders',
      'insect': 'Insects',
      'water': 'Water & Drowning',
      'drown': 'Water & Drowning',
      'fire': 'Fire & Flames',
      'burn': 'Fire & Burns',
      'blood': 'Blood & Gore',
      'dead': 'Death & The Dead',
      'corpse': 'Death & The Dead',
      'alone': 'Isolation & Loneliness',
      'abandon': 'Abandonment',
      'failure': 'Failure & Inadequacy',
      'reject': 'Rejection',
      'storm': 'Storms & Thunder',
      'thunder': 'Storms & Thunder',
      'snake': 'Snakes',
      'animal': 'Animals',
      'open': 'Open Spaces',
      'outside': 'Open Spaces',
    };
    
    // Check stimulus, source, and context for matches
    const searchTexts = [
      te?.details.stimulus || '',
      te?.source || '',
      te?.details.environmentalContext || '',
      modifier.triggerCause || '',
      modifier.description || '',
    ].join(' ').toLowerCase();
    
    for (const [key, label] of Object.entries(causeMappings)) {
      if (searchTexts.includes(key)) return label;
    }
    
    // Return phobia name if available
    if (phobiaName) return phobiaName;
    
    return 'Environmental Trigger';
  }
  
  // For injuries
  if (modifier.category === 'injury') {
    const te = modifier.triggerEvent;
    if (te?.details.weapon) return toTitleCase(te.details.weapon);
    if (te?.details.damageType) return toTitleCase(te.details.damageType);
    if (te?.details.action) return toTitleCase(te.details.action.split(' ').slice(0, 3).join(' '));
    return toTitleCase(modifier.name);
  }
  
  // For other types
  if (modifier.triggerEvent?.source) {
    return toTitleCase(modifier.triggerEvent.source.replace(/_/g, ' '));
  }
  
  return toTitleCase(modifier.category);
}

// Generate a cliff note summary from the context without copy-pasting the narrative
function getCliffNoteSummary(
  modifier: Modifier,
  triggerDisplay: { stimulus: string | null; stimulusType: string | null; cause: string | null; context: string | null },
  snapshotText: string | null
): string {
  const te = modifier.triggerEvent;
  const parts: string[] = [];
  
  // What happened
  if (triggerDisplay.stimulus) {
    // Summarize the stimulus into a brief action
    const summarized = summarizeNarrative(triggerDisplay.stimulus);
    if (summarized) parts.push(summarized);
  }
  
  // Where/when context
  if (triggerDisplay.context) {
    parts.push(triggerDisplay.context);
  } else if (te?.details.environmentalContext) {
    parts.push(te.details.environmentalContext);
  }
  
  // For phobias, add the reaction
  if (modifier.category === 'phobia' || modifier.category === 'psychological') {
    if (parts.length === 0 && snapshotText) {
      // Extract key action from snapshot
      const summarized = summarizeNarrative(snapshotText);
      if (summarized) parts.push(summarized);
    }
    if (parts.length > 0) {
      parts.push('This triggered an instinctive fear response.');
    }
  }
  
  // For injuries, describe impact
  if (modifier.category === 'injury') {
    const impactZone = te?.details.impactZone || modifier.bodyPart;
    if (impactZone && parts.length === 0) {
      parts.push(`Sustained damage to the ${impactZone.toLowerCase()}.`);
    }
  }
  
  if (parts.length === 0) {
    return 'An unexpected event caused this condition.';
  }
  
  return parts.join(' ');
}

// Summarize a narrative into a brief cliff note (1-2 sentences max)
function summarizeNarrative(text: string): string {
  if (!text) return '';
  
  // Remove quotes if present
  let clean = text.replace(/^["']|["']$/g, '').trim();
  
  // If already short, use as-is
  if (clean.length <= 60) return clean;
  
  // Extract key phrases
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return clean.slice(0, 60) + '...';
  
  // Take first sentence, truncate if needed
  const first = sentences[0].trim();
  if (first.length <= 80) return first + '.';
  
  // Extract key words and rebuild
  const words = first.split(' ').slice(0, 12);
  return words.join(' ') + '...';
}
function RewindPreviewSplash({ 
  modifier, 
  onClose, 
  onRewind,
  onJumpToMessage
}: { 
  modifier: Modifier; 
  onClose: () => void;
  onRewind?: () => void;
  onJumpToMessage?: () => void;
}) {
  const locationName = getLocationDisplay(modifier);
  const whenDisplay = getWhenDisplay(modifier);
  const phobiaName = getPhobiaName(modifier);
  const triggerDisplay = getTriggerDisplay(modifier);
  const injuryDisplay = getInjuryDisplay(modifier);
  const incidentType = getIncidentTypeLabel(modifier);
  
  // Get the origin snapshot text - this is the primary content
  const snapshotText = modifier.originSnapshot?.text 
    || modifier.narrativeExcerpt 
    || modifier.originNarrative
    || null;
  
  const isInjury = modifier.category === 'injury';
  const isFear = modifier.category === 'phobia' || modifier.category === 'psychological';
  const hasJumpTarget = modifier.originMessage?.messageId;
  
  // Determine highlight color based on type
  const highlightColor = isInjury 
    ? 'text-modifier-injury border-modifier-injury/50 bg-modifier-injury/10' 
    : 'text-modifier-neutral border-modifier-neutral/50 bg-modifier-neutral/10';
  
  return (
    <div 
      className="fixed inset-0 bg-background/95 backdrop-blur-md flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-card to-background border-2 border-primary/30 rounded-lg w-full max-w-md animate-fade-in shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Incident Type Badge */}
        <div className="p-4 text-center border-b border-border/30 bg-background/50">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertTriangle className={cn("w-5 h-5", isInjury ? "text-modifier-injury" : "text-modifier-neutral")} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Incident Replay
            </span>
          </div>
          
          {/* Location */}
          {locationName && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-narrative font-bold text-foreground">
                {locationName}
              </h2>
            </div>
          )}
          
          {/* Timestamp & Turn */}
          <p className="text-sm text-muted-foreground">
            {whenDisplay.primary}
          </p>
          {modifier.occurredAt?.turnId !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Turn #{modifier.occurredAt.turnId}
            </p>
          )}
        </div>
        
        {/* Content - Structured Incident Info */}
        <div className="p-5 space-y-4">
          {/* TRIGGER STIMULUS - The main highlighted element */}
          {triggerDisplay.stimulus && (
            <div className={cn("p-4 rounded-lg border-2", highlightColor)}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                {isInjury ? 'Injury' : 'Trigger'}
              </p>
              <p className={cn("text-base font-medium", isInjury ? "text-modifier-injury" : "text-modifier-neutral")}>
                {triggerDisplay.stimulus}
              </p>
            </div>
          )}
          
          {/* Injury Impact Zone */}
          {isInjury && injuryDisplay.impactZone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Impact Zone:</span>
              <span className="font-medium text-modifier-injury">{injuryDisplay.impactZone}</span>
            </div>
          )}
          
          {/* Cause / Source */}
          {triggerDisplay.cause && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Cause:</span>
              <span className="font-medium text-foreground">{triggerDisplay.cause}</span>
            </div>
          )}
          
          {/* Phobia Name (for fear incidents) */}
          {isFear && phobiaName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Phobia:</span>
              <span className="font-medium text-modifier-neutral">
                {phobiaName}
                {modifier.triggerEvent?.phobiaId && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({toTitleCase(modifier.triggerEvent.phobiaId)})
                  </span>
                )}
              </span>
            </div>
          )}
          
          {/* Environmental Context */}
          {triggerDisplay.context && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Context:</span>
              <span className="text-foreground">{triggerDisplay.context}</span>
            </div>
          )}
          
          {/* Why It Happened - Cause explanation with cliff note summary */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Why It Happened</p>
            
            {/* Primary Cause */}
            <div className="mb-3">
              <span className="text-xs text-muted-foreground">Cause: </span>
              <span className={cn(
                "text-sm font-semibold",
                isInjury ? "text-modifier-injury" : "text-modifier-neutral"
              )}>
                {getCauseLabel(modifier, phobiaName)}
              </span>
            </div>
            
            {/* Cliff Note Summary */}
            <p className="text-sm text-foreground/80 leading-relaxed">
              {getCliffNoteSummary(modifier, triggerDisplay, snapshotText)}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-border/30 flex flex-col gap-3 bg-background/30">
          {/* Jump to Message (primary action if available) */}
          {hasJumpTarget && onJumpToMessage && (
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={onJumpToMessage}
            >
              <ExternalLink className="w-4 h-4" />
              Jump to This Message
            </Button>
          )}
          
          {/* Rewind to Anchor (if available) */}
          {onRewind && modifier.rewindAnchorId && (
            <Button 
              variant={hasJumpTarget ? "outline" : "default"}
              className="w-full gap-2"
              onClick={onRewind}
            >
              <RotateCcw className="w-4 h-4" />
              Return to This Moment
            </Button>
          )}
          
          {/* Close */}
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ModifierDetailModal({ modifier, onClose, onRewind, onJumpToMessage }: ModifierDetailModalProps) {
  const [showRewindPreview, setShowRewindPreview] = useState(false);
  
  const Icon = getCategoryIcon(modifier.category);
  const colors = getModifierColors(modifier);
  const isPhobia = modifier.category === 'phobia';
  
  const whenDisplay = getWhenDisplay(modifier);
  const howDisplay = getHowDisplay(modifier);
  const locationName = getLocationDisplay(modifier);

  const handleRewind = () => {
    if (onRewind && modifier.rewindAnchorId && modifier.occurredAt?.turnId !== undefined) {
      onRewind(modifier.rewindAnchorId, modifier.occurredAt.turnId);
    }
  };
  
  const handleJumpToMessage = () => {
    if (onJumpToMessage && modifier.originMessage?.messageId) {
      onJumpToMessage(modifier.originMessage.messageId, modifier.originMessage.turnId);
      setShowRewindPreview(false);
    }
  };

  if (showRewindPreview) {
    return (
      <RewindPreviewSplash 
        modifier={modifier} 
        onClose={() => setShowRewindPreview(false)}
        onRewind={onRewind ? handleRewind : undefined}
        onJumpToMessage={onJumpToMessage && modifier.originMessage?.messageId ? handleJumpToMessage : undefined}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className={cn(
          "bg-card border-2 rounded-lg w-full max-w-md animate-fade-in shadow-lg max-h-[90vh] overflow-y-auto",
          colors.border,
          colors.glow
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("p-4 border-b rounded-t-lg", colors.bg, colors.border)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Icon className={cn("w-6 h-6", colors.text)} />
              </div>
              <div>
                <h2 className={cn("text-xl font-narrative font-bold", colors.text)}>
                  {modifier.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full capitalize",
                    colors.bg, colors.text
                  )}>
                    {modifier.type === 'buff' ? 'Buff' : isPhobia ? 'Phobia' : 'Debuff'}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {modifier.category}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm text-foreground leading-relaxed">
              {modifier.description}
            </p>
          </div>

          {/* Phobia notice with phobia name */}
          {isPhobia && (
            <div className="p-3 bg-modifier-neutral/10 border border-modifier-neutral/30 rounded-lg">
              <p className="text-xs text-modifier-neutral flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>
                  <strong>{getPhobiaName(modifier) || 'Phobia'}:</strong> This affects how your character speaks, 
                  reacts, and behaves but does not reduce any stats.
                </span>
              </p>
            </div>
          )}

          {/* WHEN - Precise timestamp */}
          <div className={cn(
            "p-3 rounded-lg border-2",
            "bg-primary/5 border-primary/20"
          )}>
            <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2 text-primary">
              <Calendar className="w-3 h-3" />
              When
            </h3>
            <p className="text-sm font-medium text-foreground">
              {whenDisplay.primary}
            </p>
            {whenDisplay.secondary && (
              <p className="text-xs text-muted-foreground mt-1">
                {whenDisplay.secondary}
              </p>
            )}
            {modifier.occurredAt?.turnId !== undefined && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Turn #{modifier.occurredAt.turnId}
              </p>
            )}
          </div>

          {/* HOW - What happened (with phobia name) - Title Case enforced */}
          {howDisplay && (
            <div className={cn(
              "p-3 rounded-lg border-2",
              colors.bg, colors.border
            )}>
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: 'inherit' }}>
                <AlertTriangle className="w-3 h-3" />
                How It Happened
              </h3>
              <p className={cn("text-sm font-medium", colors.text)}>
                {toTitleCase(howDisplay.source)}
              </p>
              {howDisplay.type && (
                <p className="text-xs text-muted-foreground mt-1">
                  Type: {toTitleCase(howDisplay.type)}
                </p>
              )}
              {howDisplay.phobia && (
                <p className="text-xs font-medium text-modifier-neutral mt-1">
                  Phobia: {toTitleCase(howDisplay.phobia)}
                </p>
              )}
              {howDisplay.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {howDisplay.details}
                </p>
              )}
            </div>
          )}

          {/* WHERE - Location (only show if we have a real location) */}
          {locationName && (
            <div className="flex items-start gap-2 text-sm p-2 bg-background/50 rounded border border-border/30">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground">Location: </span>
                <span className="text-foreground">{locationName}</span>
              </div>
            </div>
          )}

          {/* Rewind Preview Button (replaces narrative excerpt) */}
          {(modifier.narrativeExcerpt || modifier.originNarrative || locationName) && (
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/30 hover:bg-primary/10"
              onClick={() => setShowRewindPreview(true)}
            >
              <RotateCcw className="w-4 h-4" />
              View Incident
            </Button>
          )}

          {/* Severity - shows SCALED effect (2-8% range) */}
          {!isPhobia && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Effect Strength</span>
                <span className={cn("font-medium", colors.text)}>
                  {modifier.type === 'buff' ? '+' : '-'}{getModifierEffectPercentage(modifier)}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", colors.text.replace('text-', 'bg-'))}
                  style={{ width: `${Math.min(100, Math.max(25, ((getModifierEffectPercentage(modifier) - 2) / 6) * 75 + 25))}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Individual effects are small (2-8%) but stack with others
              </p>
            </div>
          )}

          {/* Duration (in turns) */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">
              {formatDuration(modifier.duration.remaining, modifier.duration.appliedAtTurn)}
            </span>
          </div>

          {/* Effects (if any) - show scaled percentages */}
          {modifier.effects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stat Adjustments
              </h3>
              <div className="flex flex-wrap gap-2">
                {modifier.effects.map((effect, idx) => {
                  // Scale effect value to 2-8% range based on modifier severity
                  const scaledValue = effect.value * getModifierEffectPercentage(modifier) / 100;
                  const displayValue = Math.round(scaledValue * 100);
                  return (
                    <span 
                      key={idx}
                      className={cn(
                        "text-xs px-2 py-1 rounded border",
                        effect.value > 0 
                          ? 'bg-modifier-buff/10 text-modifier-buff border-modifier-buff/30' 
                          : 'bg-modifier-injury/10 text-modifier-injury border-modifier-injury/30'
                      )}
                    >
                      {effect.stat}: {effect.value > 0 ? '+' : ''}{displayValue > 0 ? displayValue : Math.abs(displayValue)}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolution Paths */}
          {modifier.resolutionPaths.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                How to Resolve
              </h3>
              <div className="flex flex-wrap gap-2">
                {modifier.resolutionPaths.map((path, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 capitalize"
                  >
                    {path.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
