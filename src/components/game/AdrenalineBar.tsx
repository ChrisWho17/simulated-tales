import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  AdrenalineSystemState, 
  getAdrenalineStatus, 
  getCurrentThreshold,
  getThresholdInfo,
  Wound 
} from '@/game/adrenalineSystem';
import { AlertTriangle, Droplets } from 'lucide-react';

interface AdrenalineBarProps {
  state: AdrenalineSystemState;
  compact?: boolean;
  onAssess?: (thoroughness: 'quick' | 'careful' | 'thorough') => void;
  recentEvent?: {
    type: 'wound_revealed' | 'damage_hidden';
    message?: string;
    vagueSymptom?: string;
  } | null;
}

export const AdrenalineBar: React.FC<AdrenalineBarProps> = ({ 
  state, 
  compact = false,
  recentEvent 
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const status = getAdrenalineStatus(state);
  const threshold = getCurrentThreshold(state);
  const thresholdInfo = getThresholdInfo(threshold);
  
  const percentage = (status.adrenaline / status.maxAdrenaline) * 100;
  
  // Calculate color based on percentage
  const getBarColor = useCallback((pct: number) => {
    if (pct < 20) return 'hsl(142, 76%, 36%)';     // Green - Calm
    if (pct < 40) return 'hsl(84, 81%, 44%)';      // Light green - Alert
    if (pct < 60) return 'hsl(48, 96%, 53%)';      // Yellow - Stressed
    if (pct < 80) return 'hsl(25, 95%, 53%)';      // Orange - Adrenaline
    return 'hsl(0, 84%, 60%)';                      // Red - Max
  }, []);
  
  const barColor = getBarColor(percentage);
  const shouldPulse = percentage > 40;
  
  useEffect(() => {
    if (recentEvent?.type === 'damage_hidden') {
      setPulseIntensity(0.8);
      const timeout = setTimeout(() => setPulseIntensity(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [recentEvent]);
  
  if (compact) {
    return (
      <div className="relative flex items-center gap-1.5">
        <div className="w-16 h-1.5 bg-background/50 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: barColor
            }}
          />
        </div>
        {status.hiddenWounds > 0 && (
          <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
        )}
        {status.totalActiveBleeding > 0 && (
          <Droplets className="w-3 h-3 text-red-500 animate-pulse" />
        )}
      </div>
    );
  }
  
  return (
    <div className="relative space-y-1">
      {/* Main adrenaline bar */}
      <div className="relative h-2 bg-background/30 rounded-full overflow-visible">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            shouldPulse && "animate-pulse"
          )}
          style={{ 
            width: `${percentage}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 ${8 + pulseIntensity * 15}px ${barColor}`,
          }}
        />
        
        {/* Threshold markers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-[20%] w-px bg-foreground/20" />
          <div className="absolute top-0 bottom-0 left-[40%] w-px bg-foreground/20" />
          <div className="absolute top-0 bottom-0 left-[60%] w-px bg-foreground/20" />
          <div className="absolute top-0 bottom-0 left-[80%] w-px bg-foreground/20" />
        </div>
      </div>
      
      {/* Status label */}
      <div className="flex items-center gap-2 text-xs">
        <span 
          className="font-semibold uppercase tracking-wider"
          style={{ color: barColor }}
        >
          {thresholdInfo.name}
        </span>
        
        {status.hiddenWounds > 0 && (
          <span 
            className="animate-pulse cursor-help" 
            title="You may have unnoticed injuries"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
        
        {status.totalActiveBleeding > 0 && (
          <span 
            className="animate-pulse cursor-help"
            title={`Bleeding: ${status.totalActiveBleeding.toFixed(1)}/min`}
          >
            <Droplets className="w-3.5 h-3.5 text-red-500" />
          </span>
        )}
      </div>
      
      {/* Recent event popup */}
      {recentEvent && (
        <div 
          className={cn(
            "absolute -top-8 left-0 right-0 px-2 py-1 rounded text-xs",
            "bg-background/90 border border-border/50 backdrop-blur-sm",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
            recentEvent.type === 'wound_revealed' && "border-l-2 border-l-red-500",
            recentEvent.type === 'damage_hidden' && "text-muted-foreground italic"
          )}
        >
          {recentEvent.type === 'wound_revealed' && recentEvent.message}
          {recentEvent.type === 'damage_hidden' && recentEvent.vagueSymptom}
        </div>
      )}
    </div>
  );
};

// Wound card component
interface WoundCardProps {
  wound: Wound;
  onTreat?: (treatmentType: 'pressure' | 'bandage' | 'first_aid' | 'medical') => void;
}

export const WoundCard: React.FC<WoundCardProps> = ({ wound, onTreat }) => {
  const severityColors: Record<number, string> = {
    1: 'bg-green-500',
    2: 'bg-yellow-500',
    3: 'bg-orange-500',
    4: 'bg-red-500',
    5: 'bg-red-700'
  };
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border",
        wound.treated 
          ? "bg-muted/30 border-green-500/30 opacity-60" 
          : "bg-background/50 border-border/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span 
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
            severityColors[wound.severity] || "bg-muted"
          )}
        >
          {wound.severity}
        </span>
        <span className="font-medium text-sm">{wound.typeName}</span>
        <span className="text-xs text-muted-foreground ml-auto">{wound.locationName}</span>
      </div>
      
      <div className="flex gap-3 text-xs mb-2">
        <span className="text-red-400">-{wound.hpDamage} HP</span>
        {wound.bleedRate > 0 && !wound.treated && (
          <span className="text-red-500 animate-pulse flex items-center gap-1">
            <Droplets className="w-3 h-3" />
            {wound.bleedRate}/min
          </span>
        )}
        {wound.treated && (
          <span className="text-green-500">✓ Treated</span>
        )}
      </div>
      
      {!wound.treated && onTreat && (
        <div className="flex gap-1 flex-wrap">
          <button 
            onClick={() => onTreat('pressure')}
            className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Pressure
          </button>
          <button 
            onClick={() => onTreat('bandage')}
            className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Bandage
          </button>
          <button 
            onClick={() => onTreat('first_aid')}
            className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 rounded text-red-400 hover:bg-red-500/20 transition-colors"
          >
            First Aid
          </button>
        </div>
      )}
    </div>
  );
};

// Wound status panel
interface WoundStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: AdrenalineSystemState;
  onAssess: (thoroughness: 'quick' | 'careful' | 'thorough') => void;
  onTreat: (woundId: string, treatmentType: 'pressure' | 'bandage' | 'first_aid' | 'medical') => void;
}

export const WoundStatusPanel: React.FC<WoundStatusPanelProps> = ({
  isOpen,
  onClose,
  state,
  onAssess,
  onTreat
}) => {
  if (!isOpen) return null;
  
  const status = getAdrenalineStatus(state);
  const untreatedWounds = state.hiddenDamage.revealedWounds.filter(w => !w.treated);
  const treatedWounds = state.hiddenDamage.revealedWounds.filter(w => w.treated);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[80vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2">
            🩹 Physical Condition
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Adrenaline status */}
          <div className="space-y-2">
            <h4 className="text-sm text-muted-foreground">Adrenaline Level</h4>
            <AdrenalineBar state={state} />
            <p className="text-xs text-muted-foreground">
              {status.thresholdInfo.description}
            </p>
          </div>
          
          {/* Assess self buttons */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <h4 className="text-sm text-muted-foreground">Check Yourself</h4>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => onAssess('quick')}
                className="flex-1 min-w-[100px] px-3 py-2 text-xs bg-muted/50 border border-border/50 rounded hover:bg-muted transition-colors"
              >
                Quick (2s)
              </button>
              <button 
                onClick={() => onAssess('careful')}
                className="flex-1 min-w-[100px] px-3 py-2 text-xs bg-muted/50 border border-border/50 rounded hover:bg-muted transition-colors"
              >
                Careful (10s)
              </button>
              <button 
                onClick={() => onAssess('thorough')}
                className="flex-1 min-w-[100px] px-3 py-2 text-xs bg-muted/50 border border-border/50 rounded hover:bg-muted transition-colors"
              >
                Thorough (30s)
              </button>
            </div>
            {status.hiddenWounds > 0 && (
              <p className="text-xs text-amber-500 italic animate-pulse">
                Something doesn't feel right...
              </p>
            )}
          </div>
          
          {/* Active wounds */}
          {untreatedWounds.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <h4 className="text-sm text-amber-500">
                ⚠️ Active Wounds ({untreatedWounds.length})
              </h4>
              {untreatedWounds.map(wound => (
                <WoundCard 
                  key={wound.id} 
                  wound={wound}
                  onTreat={(type) => onTreat(wound.id, type)}
                />
              ))}
            </div>
          )}
          
          {/* Treated wounds */}
          {treatedWounds.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <h4 className="text-sm text-green-500">
                ✓ Treated Wounds ({treatedWounds.length})
              </h4>
              {treatedWounds.map(wound => (
                <WoundCard key={wound.id} wound={wound} />
              ))}
            </div>
          )}
          
          {untreatedWounds.length === 0 && treatedWounds.length === 0 && status.hiddenWounds === 0 && (
            <div className="text-center py-6 text-green-500">
              ✓ No visible injuries
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdrenalineBar;
