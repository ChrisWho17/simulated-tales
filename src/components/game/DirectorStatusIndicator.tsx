// Director Status Indicator - Mini display for Director system state
import React from 'react';
import { Gauge, AlertTriangle, Swords, MessageCircle, Compass, BookOpen, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemPriority, getDirectorState, getEscalationLevel } from '@/game/directorSystem';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DirectorStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

const PRIORITY_CONFIG: Record<SystemPriority, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  SAFETY: { 
    icon: AlertTriangle, 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/20',
    label: 'Critical' 
  },
  COMBAT: { 
    icon: Swords, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500/20',
    label: 'Combat' 
  },
  CRISIS: { 
    icon: AlertTriangle, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/20',
    label: 'Crisis' 
  },
  SOCIAL: { 
    icon: MessageCircle, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/20',
    label: 'Social' 
  },
  EXPLORATION: { 
    icon: Compass, 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/20',
    label: 'Exploring' 
  },
  NARRATIVE: { 
    icon: BookOpen, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-500/20',
    label: 'Story' 
  },
  AMBIENT: { 
    icon: Gauge, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/40',
    label: 'Idle' 
  },
};

export const DirectorStatusIndicator: React.FC<DirectorStatusIndicatorProps> = ({ 
  className,
  compact = false 
}) => {
  const [state, setState] = React.useState(() => getDirectorState());
  
  // Refresh state periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setState(getDirectorState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const priority = state.currentPriority;
  const escalation = state.escalationLevel;
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  
  // Escalation color gradient
  const getEscalationColor = () => {
    if (escalation >= 80) return 'bg-destructive';
    if (escalation >= 60) return 'bg-orange-500';
    if (escalation >= 40) return 'bg-amber-500';
    if (escalation >= 20) return 'bg-emerald-500';
    return 'bg-muted-foreground/50';
  };
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                config.bgColor,
                config.color,
                className
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{config.label}</span>
              {escalation > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  <Gauge className="w-3 h-3 opacity-70" />
                  <span className="opacity-70">{Math.round(escalation)}</span>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1.5">
              <div className="font-medium">Director: {config.label}</div>
              <div className="text-xs text-muted-foreground">
                Priority: {priority} • Escalation: {Math.round(escalation)}%
              </div>
              {state.turnsAtPriority > 0 && (
                <div className="text-xs text-muted-foreground">
                  At this priority for {state.turnsAtPriority} turns
                </div>
              )}
              {state.recentBeats.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Recent: {state.recentBeats.slice(0, 2).map(b => b.name).join(', ')}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div 
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50',
        config.bgColor,
        className
      )}
    >
      {/* Priority Icon */}
      <div className={cn('flex items-center gap-2', config.color)}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
      
      {/* Escalation Bar */}
      <div className="flex items-center gap-2 flex-1">
        <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex-1 h-1.5 bg-background/50 rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-500', getEscalationColor())}
            style={{ width: `${Math.min(100, escalation)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8">
          {Math.round(escalation)}%
        </span>
      </div>
    </div>
  );
};
