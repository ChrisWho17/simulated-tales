// Visual indicator for NPC reactions to player clothing/appearance

import { useState, useEffect } from 'react';
import { 
  ClothingReaction, 
  getPlayerClothingReaction,
  ClothingContext 
} from '@/game/clothingReactionSystem';
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  XCircle, 
  Shirt,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ClothingReactionIndicatorProps {
  npcRole?: string;
  npcName?: string;
  locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred';
  compact?: boolean;
  showDetails?: boolean;
}

export function ClothingReactionIndicator({
  npcRole,
  npcName,
  locationFormality,
  compact = false,
  showDetails = false
}: ClothingReactionIndicatorProps) {
  const [reaction, setReaction] = useState<ClothingReaction | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const clothingReaction = getPlayerClothingReaction(npcRole, locationFormality);
    setReaction(clothingReaction);
  }, [npcRole, locationFormality]);

  if (!reaction || reaction.severity === 'none') {
    return null;
  }

  const getSeverityConfig = () => {
    switch (reaction.severity) {
      case 'mild':
        return {
          icon: Eye,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          label: 'Curious',
          description: 'Your appearance draws some attention'
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          label: 'Uncomfortable',
          description: 'Your appearance makes them noticeably uncomfortable'
        };
      case 'severe':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          label: 'Hostile',
          description: 'Your appearance causes strong negative reactions'
        };
      default:
        return null;
    }
  };

  const config = getSeverityConfig();
  if (!config) return null;

  const Icon = config.icon;

  // Compact mode - just an icon with tooltip
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full",
              config.bgColor,
              "cursor-help transition-all hover:scale-110"
            )}>
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <div className={cn("font-semibold flex items-center gap-1", config.color)}>
                <Shirt className="w-3 h-3" />
                Appearance Reaction: {config.label}
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              {reaction.internalThoughts.length > 0 && (
                <p className="text-xs italic text-foreground/70">
                  "{reaction.internalThoughts[0]}"
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode with expandable details
  return (
    <div className={cn(
      "rounded-lg border p-2 transition-all",
      config.bgColor,
      config.borderColor
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                config.bgColor
              )}>
                <Icon className={cn("w-3.5 h-3.5", config.color)} />
              </div>
              <div className="text-left">
                <div className={cn("text-xs font-medium", config.color)}>
                  {npcName ? `${npcName} reacts to your appearance` : 'Appearance Reaction'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {config.label} - {config.description}
                </div>
              </div>
            </div>
            {showDetails && (
              <div className="text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </CollapsibleTrigger>
        
        {showDetails && (
          <CollapsibleContent>
            <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
              {/* NPC's internal thought */}
              {reaction.internalThoughts.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Thinking: </span>
                  <span className="italic text-foreground/80">
                    "{reaction.internalThoughts[0]}"
                  </span>
                </div>
              )}
              
              {/* Possible comments */}
              {reaction.possibleComments.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Might say: </span>
                  <span className="text-foreground/80">
                    {reaction.possibleComments[0]}
                  </span>
                </div>
              )}
              
              {/* Modifiers */}
              <div className="flex flex-wrap gap-1">
                {reaction.trustModifier !== 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    reaction.trustModifier < 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  )}>
                    Trust {reaction.trustModifier > 0 ? '+' : ''}{reaction.trustModifier}
                  </span>
                )}
                {reaction.respectModifier !== 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    reaction.respectModifier < 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  )}>
                    Respect {reaction.respectModifier > 0 ? '+' : ''}{reaction.respectModifier}
                  </span>
                )}
              </div>
              
              {/* Behavior triggers */}
              {reaction.npcBehaviorTriggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {reaction.npcBehaviorTriggers.slice(0, 3).map((trigger, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {trigger.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

// Badge version for inline display
export function ClothingReactionBadge({
  npcRole,
  locationFormality
}: {
  npcRole?: string;
  locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred';
}) {
  const [reaction, setReaction] = useState<ClothingReaction | null>(null);

  useEffect(() => {
    const clothingReaction = getPlayerClothingReaction(npcRole, locationFormality);
    setReaction(clothingReaction);
  }, [npcRole, locationFormality]);

  if (!reaction || reaction.severity === 'none') {
    return null;
  }

  const config = {
    mild: { bg: 'bg-warning/20', text: 'text-warning', label: '👀' },
    moderate: { bg: 'bg-orange-500/20', text: 'text-orange-500', label: '⚠️' },
    severe: { bg: 'bg-destructive/20', text: 'text-destructive', label: '❌' }
  }[reaction.severity];

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
      config.bg,
      config.text
    )}>
      {config.label} Appearance
    </span>
  );
}
