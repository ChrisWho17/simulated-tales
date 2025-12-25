import { Modifier, ModifierOccurredAt, ModifierTriggerEvent } from '@/game/buffDebuffSystem';
import { Button } from '@/components/ui/button';
import { 
  X, Shield, Zap, Heart, Brain, Thermometer, Dumbbell, Pill, Activity, Eye,
  MapPin, Clock, AlertTriangle, Sparkles, Calendar, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModifierDetailModalProps {
  modifier: Modifier;
  onClose: () => void;
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

function formatDuration(remaining: number): string {
  if (remaining === Infinity) return 'Permanent';
  if (remaining < 1) return `${Math.round(remaining * 60)} minutes`;
  if (remaining < 24) return `${Math.round(remaining)} hours`;
  return `${Math.round(remaining / 24)} days`;
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

// Get the "How" display string from trigger event
function getHowDisplay(modifier: Modifier): { 
  source: string; 
  details?: string;
  type?: string;
} | null {
  // Priority 1: Use structured triggerEvent
  if (modifier.triggerEvent) {
    const te = modifier.triggerEvent;
    let details: string | undefined;
    
    // Build details string from trigger event details
    const detailParts: string[] = [];
    if (te.details.stimulus) detailParts.push(te.details.stimulus);
    if (te.details.bodyPart) detailParts.push(`affected: ${te.details.bodyPart}`);
    if (te.details.weapon) detailParts.push(`weapon: ${te.details.weapon}`);
    if (te.details.action) detailParts.push(te.details.action);
    if (te.details.emotionalContext?.length) {
      detailParts.push(`emotional context: ${te.details.emotionalContext.join(', ')}`);
    }
    
    if (detailParts.length > 0) {
      details = detailParts.join(' • ');
    }
    
    return {
      source: te.source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      details,
      type: te.type.replace(/_/g, ' '),
    };
  }
  
  // Priority 2: Use legacy incidentDescription
  if (modifier.incidentDescription) {
    return {
      source: modifier.incidentDescription,
      details: modifier.bodyPart ? `Affected area: ${modifier.bodyPart}` : undefined,
    };
  }
  
  // Priority 3: Use triggerCause for phobias
  if (modifier.triggerCause) {
    return {
      source: modifier.triggerCause,
      type: 'phobia trigger',
    };
  }
  
  return null;
}

export function ModifierDetailModal({ modifier, onClose }: ModifierDetailModalProps) {
  const Icon = getCategoryIcon(modifier.category);
  const colors = getModifierColors(modifier);
  const isPhobia = modifier.category === 'phobia';
  
  const whenDisplay = getWhenDisplay(modifier);
  const howDisplay = getHowDisplay(modifier);

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

          {/* Phobia notice */}
          {isPhobia && (
            <div className="p-3 bg-modifier-neutral/10 border border-modifier-neutral/30 rounded-lg">
              <p className="text-xs text-modifier-neutral flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>
                  <strong>Behavioral Only:</strong> This phobia affects how your character speaks, 
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

          {/* HOW - What happened */}
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
                {howDisplay.source}
              </p>
              {howDisplay.type && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  Type: {howDisplay.type}
                </p>
              )}
              {howDisplay.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {howDisplay.details}
                </p>
              )}
            </div>
          )}

          {/* WHERE - Location */}
          {(modifier.originLocation || modifier.triggerEvent?.details.location) && (
            <div className="flex items-start gap-2 text-sm p-2 bg-background/50 rounded border border-border/30">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground">Location: </span>
                <span className="text-foreground">
                  {modifier.triggerEvent?.details.location || modifier.originLocation}
                </span>
              </div>
            </div>
          )}

          {/* Narrative Excerpt (flavor text - italicized) */}
          {(modifier.narrativeExcerpt || modifier.originNarrative) && (
            <div className="p-3 bg-card rounded border border-border/30">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{modifier.narrativeExcerpt || modifier.originNarrative}"
              </p>
            </div>
          )}

          {/* Severity */}
          {!isPhobia && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Severity</span>
                <span className={cn("font-medium", colors.text)}>
                  {getSeverityLabel(modifier.severity)} ({Math.round(modifier.severity * 100)}%)
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all", colors.text.replace('text-', 'bg-'))}
                  style={{ width: `${modifier.severity * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{formatDuration(modifier.duration.remaining)}</span>
          </div>

          {/* Effects (if any) */}
          {modifier.effects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Effects on Stats
              </h3>
              <div className="flex flex-wrap gap-2">
                {modifier.effects.map((effect, idx) => (
                  <span 
                    key={idx}
                    className={cn(
                      "text-xs px-2 py-1 rounded border",
                      effect.value > 0 
                        ? 'bg-modifier-buff/10 text-modifier-buff border-modifier-buff/30' 
                        : 'bg-modifier-injury/10 text-modifier-injury border-modifier-injury/30'
                    )}
                  >
                    {effect.stat}: {effect.value > 0 ? '+' : ''}{Math.round(effect.value * 100)}%
                  </span>
                ))}
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