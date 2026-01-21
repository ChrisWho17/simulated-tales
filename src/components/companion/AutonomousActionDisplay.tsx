// ============================================================================
// AUTONOMOUS ACTION DISPLAY - Inline narrative display for companion actions
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Heart, Skull, MessageSquare, Users, 
  ArrowRight, X, ChevronDown, ChevronUp, Sparkles,
  Shield, Flame, LogOut, HandHeart, Swords, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  AutonomousAction, 
  AutonomousDecisionType, 
  PlayerResponseOption 
} from '@/game/companion/companionAutonomy';
import { CompanionState } from '@/game/companionSystem';

// ============================================================================
// TYPES
// ============================================================================

interface AutonomousActionDisplayProps {
  companion: CompanionState;
  action: AutonomousAction;
  onPlayerResponse: (response: PlayerResponseOption) => void;
  onDismiss: () => void;
  variant?: 'inline' | 'modal' | 'toast';
}

interface AutonomousActionFeedProps {
  actions: Map<string, AutonomousAction[]>;
  companions: CompanionState[];
  onPlayerResponse: (companionId: string, action: AutonomousAction, response: PlayerResponseOption) => void;
  onDismiss: (companionId: string, action: AutonomousAction) => void;
}

// ============================================================================
// ACTION TYPE CONFIG
// ============================================================================

const ACTION_CONFIG: Record<AutonomousDecisionType, {
  icon: typeof AlertTriangle;
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}> = {
  quest_refusal: {
    icon: X,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    label: 'Quest Refusal',
    urgency: 'medium',
  },
  departure_warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    label: 'Warning',
    urgency: 'high',
  },
  departure: {
    icon: LogOut,
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    label: 'Leaving',
    urgency: 'critical',
  },
  goal_initiation: {
    icon: Sparkles,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    label: 'Personal Quest',
    urgency: 'medium',
  },
  opinion_voiced: {
    icon: MessageSquare,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    label: 'Opinion',
    urgency: 'low',
  },
  confrontation: {
    icon: Flame,
    color: 'text-orange-500',
    borderColor: 'border-orange-600/30',
    bgColor: 'bg-orange-600/10',
    label: 'Confrontation',
    urgency: 'high',
  },
  secret_reveal: {
    icon: Shield,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    label: 'Secret Revealed',
    urgency: 'medium',
  },
  romance_advance: {
    icon: Heart,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    label: 'Romantic',
    urgency: 'medium',
  },
  betrayal: {
    icon: Skull,
    color: 'text-red-500',
    borderColor: 'border-red-600/30',
    bgColor: 'bg-red-600/10',
    label: 'Betrayal!',
    urgency: 'critical',
  },
  sacrifice_offer: {
    icon: HandHeart,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    label: 'Sacrifice',
    urgency: 'critical',
  },
  intervention: {
    icon: Shield,
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    label: 'Intervention',
    urgency: 'medium',
  },
  alliance_proposal: {
    icon: Crown,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    label: 'Proposal',
    urgency: 'medium',
  },
};

const RESPONSE_TYPE_STYLES: Record<string, string> = {
  agree: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30',
  disagree: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30',
  negotiate: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30',
  dismiss: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
  threaten: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30',
  comfort: 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border-pink-500/30',
};

// ============================================================================
// SINGLE ACTION DISPLAY
// ============================================================================

export function AutonomousActionDisplay({
  companion,
  action,
  onPlayerResponse,
  onDismiss,
  variant = 'inline',
}: AutonomousActionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(variant !== 'toast');
  const [isExiting, setIsExiting] = useState(false);
  
  const config = ACTION_CONFIG[action.type];
  const Icon = config.icon;
  
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);
  
  const handleResponse = useCallback((response: PlayerResponseOption) => {
    setIsExiting(true);
    setTimeout(() => onPlayerResponse(response), 300);
  }, [onPlayerResponse]);
  
  // Toast variant - compact, auto-dismissing
  if (variant === 'toast') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 20 : 0, scale: isExiting ? 0.95 : 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          "p-3 rounded-lg border backdrop-blur-sm cursor-pointer",
          config.bgColor, config.borderColor
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4 shrink-0", config.color)} />
          <span className="font-medium text-sm">{companion.name}</span>
          <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
        </div>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-2 text-sm italic text-foreground/80"
          >
            "{action.dialogue}"
          </motion.div>
        )}
      </motion.div>
    );
  }
  
  // Inline variant - embedded in narrative
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isExiting ? 0 : 1, x: isExiting ? -20 : 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "my-4 rounded-lg border overflow-hidden",
        config.bgColor, config.borderColor,
        action.priority === 'critical' && "ring-2 ring-red-500/50 animate-pulse"
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 py-3 cursor-pointer",
          "border-b", config.borderColor
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{companion.name}</span>
              <Badge variant="outline" className={cn("text-xs", config.color)}>
                {config.label}
              </Badge>
              {action.priority === 'critical' && (
                <Badge variant="destructive" className="text-[10px]">URGENT</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {action.blocksPlayerAction ? 'Requires immediate response' : 'Awaiting your response'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Dialogue */}
              <div className="relative pl-4 border-l-2 border-primary/30">
                <p className="text-sm italic leading-relaxed">"{action.dialogue}"</p>
              </div>
              
              {/* Internal reason (debug mode only - could be gated) */}
              {action.internalReason && (
                <p className="text-xs text-muted-foreground italic">
                  💭 {action.internalReason}
                </p>
              )}
              
              {/* Consequences preview */}
              {action.consequences && action.consequences.length > 0 && (
                <div className="p-2 rounded bg-muted/30 text-xs">
                  <span className="font-medium">Possible consequences:</span>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {action.consequences.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Player response options */}
              {action.playerOptions && action.playerOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {action.playerOptions.map((option, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "gap-1 transition-all",
                        RESPONSE_TYPE_STYLES[option.type]
                      )}
                      onClick={() => handleResponse(option)}
                    >
                      {option.label}
                      {option.affinityChange !== 0 && (
                        <span className={cn(
                          "text-[10px]",
                          option.affinityChange > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          ({option.affinityChange > 0 ? '+' : ''}{option.affinityChange})
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Dismiss button if no blocking */}
              {!action.blocksPlayerAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleDismiss}
                >
                  Continue without responding
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// ACTION FEED - Multiple actions in narrative
// ============================================================================

export function AutonomousActionFeed({
  actions,
  companions,
  onPlayerResponse,
  onDismiss,
}: AutonomousActionFeedProps) {
  const [displayedActions, setDisplayedActions] = useState<
    Array<{ companionId: string; companion: CompanionState; action: AutonomousAction }>
  >([]);
  
  // Convert map to array for display
  useEffect(() => {
    const result: Array<{ companionId: string; companion: CompanionState; action: AutonomousAction }> = [];
    
    actions.forEach((actionList, companionId) => {
      const companion = companions.find(c => c.id === companionId);
      if (!companion) return;
      
      // Show highest priority action per companion
      const sortedActions = [...actionList].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      if (sortedActions.length > 0) {
        result.push({ companionId, companion, action: sortedActions[0] });
      }
    });
    
    // Sort by priority
    result.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.action.priority] - priorityOrder[a.action.priority];
    });
    
    setDisplayedActions(result);
  }, [actions, companions]);
  
  if (displayedActions.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {displayedActions.map(({ companionId, companion, action }) => (
          <AutonomousActionDisplay
            key={`${companionId}-${action.type}`}
            companion={companion}
            action={action}
            onPlayerResponse={(response) => onPlayerResponse(companionId, action, response)}
            onDismiss={() => onDismiss(companionId, action)}
            variant="inline"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// NARRATIVE INTERRUPTION OVERLAY
// ============================================================================

interface NarrativeInterruptionProps {
  companion: CompanionState;
  action: AutonomousAction;
  onPlayerResponse: (response: PlayerResponseOption) => void;
}

export function NarrativeInterruption({
  companion,
  action,
  onPlayerResponse,
}: NarrativeInterruptionProps) {
  const config = ACTION_CONFIG[action.type];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={cn(
          "w-full max-w-lg rounded-xl border-2 overflow-hidden",
          "bg-card shadow-2xl",
          config.borderColor
        )}
      >
        {/* Dramatic header */}
        <div className={cn("px-6 py-4 flex items-center gap-4", config.bgColor)}>
          <div className={cn("p-3 rounded-full bg-background/50")}>
            <Icon className={cn("w-6 h-6", config.color)} />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {companion.name}
              <Badge className={cn("text-xs", config.color, config.bgColor)}>
                {config.label}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {action.blocksPlayerAction ? 'Demands your attention' : 'Seeks your response'}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="relative pl-4 border-l-2 border-primary/30">
            <p className="text-base italic leading-relaxed">"{action.dialogue}"</p>
          </div>
          
          {action.internalReason && (
            <p className="text-xs text-muted-foreground italic">
              💭 {action.internalReason}
            </p>
          )}
          
          {action.consequences && action.consequences.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <span className="font-medium text-amber-400">⚠️ Consequences:</span>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {action.consequences.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Response options */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-2">
          {action.playerOptions?.map((option, i) => (
            <Button
              key={i}
              variant="outline"
              className={cn(
                "w-full justify-between gap-2",
                RESPONSE_TYPE_STYLES[option.type]
              )}
              onClick={() => onPlayerResponse(option)}
            >
              <span>{option.label}</span>
              <div className="flex items-center gap-2 text-xs">
                {option.affinityChange !== 0 && (
                  <span className={option.affinityChange > 0 ? "text-green-400" : "text-red-400"}>
                    {option.affinityChange > 0 ? '+' : ''}{option.affinityChange} ❤️
                  </span>
                )}
                {option.trustChange !== 0 && (
                  <span className={option.trustChange > 0 ? "text-blue-400" : "text-orange-400"}>
                    {option.trustChange > 0 ? '+' : ''}{option.trustChange} 🤝
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

console.log('[AutonomousActionDisplay] Companion autonomous action display loaded');
