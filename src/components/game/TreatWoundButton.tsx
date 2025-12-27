// Treat Wound Button - Opens dialog to apply first aid to revealed wounds

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bandage, Droplets, CheckCircle } from 'lucide-react';
import { 
  AdrenalineSystemState, 
  playerTreatWound,
  Wound 
} from '@/game/adrenalineCombatIntegration';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TreatWoundButtonProps {
  adrenalineState: AdrenalineSystemState;
  onStateUpdate: (state: AdrenalineSystemState) => void;
  disabled?: boolean;
}

type TreatmentType = 'pressure' | 'bandage' | 'first_aid' | 'medical';

const TREATMENT_INFO: Record<TreatmentType, { label: string; description: string; icon: string }> = {
  pressure: { 
    label: 'Apply Pressure', 
    description: 'Quick action to slow bleeding temporarily',
    icon: '✋'
  },
  bandage: { 
    label: 'Bandage', 
    description: 'Basic wound covering, stops minor bleeding',
    icon: '🩹'
  },
  first_aid: { 
    label: 'First Aid', 
    description: 'Proper wound care with supplies',
    icon: '🏥'
  },
  medical: { 
    label: 'Medical Treatment', 
    description: 'Professional-level care',
    icon: '💉'
  },
};

export function TreatWoundButton({ 
  adrenalineState, 
  onStateUpdate, 
  disabled = false 
}: TreatWoundButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWound, setSelectedWound] = useState<string | null>(null);
  
  const untreatedWounds = adrenalineState.hiddenDamage.revealedWounds.filter(w => !w.treated);
  const treatedWounds = adrenalineState.hiddenDamage.revealedWounds.filter(w => w.treated);
  const totalBleeding = untreatedWounds.reduce((sum, w) => sum + w.bleedRate, 0);
  
  const handleTreat = (woundId: string, treatmentType: TreatmentType) => {
    const result = playerTreatWound(adrenalineState, woundId, treatmentType);
    
    if (result.success) {
      onStateUpdate(result.state);
      setSelectedWound(null);
      
      toast.success('Wound treated!', {
        description: result.bleedingStopped 
          ? 'Bleeding has stopped.' 
          : `Healing bonus: +${result.healBonus}%`,
        duration: 3000,
      });
    } else {
      toast.error('Treatment failed', {
        description: result.error || 'Could not treat the wound.',
        duration: 3000,
      });
    }
  };
  
  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-500/20 border-red-500/50 text-red-400';
    if (severity >= 4) return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
    if (severity >= 3) return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
  };

  if (untreatedWounds.length === 0 && treatedWounds.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "gap-2 relative",
          untreatedWounds.length > 0 && "border-red-500/50 text-red-400 hover:bg-red-500/10"
        )}
      >
        <Bandage className="w-4 h-4" />
        Treat Wounds
        {untreatedWounds.length > 0 && (
          <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
            {untreatedWounds.length}
          </Badge>
        )}
        {totalBleeding > 0 && (
          <Droplets className="w-3 h-3 text-red-500 animate-pulse absolute -top-1 -right-1" />
        )}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bandage className="w-5 h-5" />
              Wound Treatment
            </DialogTitle>
            <DialogDescription>
              {untreatedWounds.length > 0 
                ? `You have ${untreatedWounds.length} wound(s) requiring treatment.`
                : 'All wounds have been treated.'}
              {totalBleeding > 0 && (
                <span className="text-red-400 ml-2">
                  Total bleeding: {totalBleeding.toFixed(1)}/min
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Untreated wounds */}
            {untreatedWounds.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  ⚠️ Untreated Wounds
                </h4>
                {untreatedWounds.map((wound) => (
                  <div 
                    key={wound.id} 
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      getSeverityColor(wound.severity),
                      selectedWound === wound.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{wound.typeName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {wound.locationName}
                        </Badge>
                        <Badge className={getSeverityColor(wound.severity)}>
                          Sev. {wound.severity}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm mb-3 flex items-center gap-3">
                      <span className="text-red-400">-{wound.hpDamage} HP</span>
                      {wound.bleedRate > 0 && (
                        <span className="text-red-500 flex items-center gap-1 animate-pulse">
                          <Droplets className="w-3 h-3" />
                          {wound.bleedRate}/min
                        </span>
                      )}
                    </div>
                    
                    {/* Treatment options */}
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(TREATMENT_INFO) as [TreatmentType, typeof TREATMENT_INFO[TreatmentType]][]).map(
                        ([type, info]) => (
                          <button
                            key={type}
                            onClick={() => handleTreat(wound.id, type)}
                            className={cn(
                              "p-2 rounded-lg border text-left transition-all",
                              "bg-background/50 border-border/50",
                              "hover:bg-primary/10 hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span>{info.icon}</span>
                              {info.label}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {info.description}
                            </p>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Treated wounds */}
            {treatedWounds.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Treated Wounds ({treatedWounds.length})
                </h4>
                {treatedWounds.map((wound) => (
                  <div 
                    key={wound.id} 
                    className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{wound.typeName}</span>
                      <Badge variant="outline" className="text-xs text-green-400 border-green-500/50">
                        {wound.locationName} • Treated
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {untreatedWounds.length === 0 && treatedWounds.length === 0 && (
              <div className="text-center py-8 text-green-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No wounds to treat</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}