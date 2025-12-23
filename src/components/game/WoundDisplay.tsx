import { AlertTriangle, Activity, Bone, Brain } from 'lucide-react';
import { Wound, WOUND_CONFIG, getWoundSeverityLabel, calculateWoundPenalty, isFullyHealed } from '@/lib/woundSystem';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WoundDisplayProps {
  wounds: Wound[];
  compact?: boolean;
}

const woundIcons: Record<string, React.ElementType> = {
  cut: Activity,
  bruise: AlertTriangle,
  fracture: Bone,
  concussion: Brain,
  burn: AlertTriangle,
  sprain: Activity,
  puncture: Activity,
};

export function WoundDisplay({ wounds, compact = false }: WoundDisplayProps) {
  if (!wounds || wounds.length === 0) {
    return null;
  }

  const activeWounds = wounds.filter(w => !isFullyHealed(w));
  
  if (activeWounds.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {activeWounds.slice(0, 3).map(wound => {
          const config = WOUND_CONFIG[wound.type];
          const Icon = woundIcons[wound.type] || AlertTriangle;
          
          return (
            <TooltipProvider key={wound.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "wound-tag",
                      wound.severity >= 4 ? "wound-tag-critical" :
                      wound.severity >= 3 ? "wound-tag-severe" :
                      wound.severity >= 2 ? "wound-tag-moderate" : "wound-tag-minor"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium">{getWoundSeverityLabel(wound.severity)} {wound.type}</p>
                  <p className="text-xs text-muted-foreground capitalize">{wound.location.replace('_', ' ')}</p>
                  <p className="text-xs mt-1">Healing: {wound.currentHealing}%</p>
                  {config && (
                    <p className="text-xs text-blood">
                      Affects: {config.affectedStats.join(', ')}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {activeWounds.length > 3 && (
          <span className="text-xs text-muted-foreground">+{activeWounds.length - 3}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="h-3 w-3 text-blood" />
        Wounds ({activeWounds.length})
      </h4>
      
      <div className="space-y-1.5">
        {activeWounds.map(wound => {
          const config = WOUND_CONFIG[wound.type];
          const Icon = woundIcons[wound.type] || AlertTriangle;
          const severityClass = wound.severity >= 4 ? "wound-tag-critical" :
                               wound.severity >= 3 ? "wound-tag-severe" :
                               wound.severity >= 2 ? "wound-tag-moderate" : "wound-tag-minor";
          
          return (
            <div 
              key={wound.id} 
              className={cn(
                "p-2 rounded-md border",
                wound.severity >= 4 ? "bg-blood/10 border-blood/30" :
                wound.severity >= 3 ? "bg-orange-500/10 border-orange-500/30" :
                wound.severity >= 2 ? "bg-amber-500/10 border-amber-500/30" : 
                "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "h-4 w-4",
                    wound.severity >= 4 ? "text-blood" :
                    wound.severity >= 3 ? "text-orange-500" :
                    wound.severity >= 2 ? "text-amber-500" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {getWoundSeverityLabel(wound.severity)} {wound.type}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{wound.location.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={cn("wound-tag", severityClass)}>
                  {Math.round(wound.currentHealing)}%
                </span>
              </div>
              
              {/* Healing progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-forest transition-all duration-500"
                  style={{ width: `${wound.currentHealing}%` }}
                />
              </div>
              
              {/* Stat penalties */}
              {config && wound.severity >= 2 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {config.affectedStats.map(stat => {
                    const penalty = calculateWoundPenalty([wound], stat);
                    if (penalty === 0) return null;
                    return (
                      <span key={stat} className="text-xs text-blood capitalize">
                        {stat} {penalty}%
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
