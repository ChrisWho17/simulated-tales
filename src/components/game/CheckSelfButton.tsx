// Check Self Button - Triggers adrenaline system assessSelf to discover hidden wounds

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Stethoscope, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { 
  AdrenalineSystemState, 
  playerAssessSelf,
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

interface CheckSelfButtonProps {
  adrenalineState: AdrenalineSystemState;
  onStateUpdate: (state: AdrenalineSystemState) => void;
  medicalSkill?: number;
  disabled?: boolean;
}

interface AssessmentResult {
  discoveredWounds: Wound[];
  status: 'clean' | 'found' | 'partial' | 'missed';
  message: string;
}

export function CheckSelfButton({ 
  adrenalineState, 
  onStateUpdate, 
  medicalSkill = 0,
  disabled = false 
}: CheckSelfButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<AssessmentResult | null>(null);
  
  const hasHiddenWounds = adrenalineState.hiddenDamage.wounds.length > 0;
  const hasRevealedUntreated = adrenalineState.hiddenDamage.revealedWounds.filter(w => !w.treated).length > 0;
  
  const handleCheckSelf = (thoroughness: 'quick' | 'careful' | 'thorough') => {
    setIsChecking(true);
    
    // Simulate time passing for the check
    const delay = thoroughness === 'quick' ? 500 : thoroughness === 'careful' ? 1000 : 1500;
    
    setTimeout(() => {
      const result = playerAssessSelf(adrenalineState, thoroughness, medicalSkill);
      
      setLastResult({
        discoveredWounds: result.discoveredWounds,
        status: result.status,
        message: result.message,
      });
      
      onStateUpdate(result.state);
      setIsChecking(false);
      setShowResults(true);
      
      // Also show toast for discovered wounds
      if (result.discoveredWounds.length > 0) {
        toast.error(`Discovered ${result.discoveredWounds.length} wound(s)!`, {
          description: result.message,
          duration: 5000,
        });
      } else if (result.status === 'clean') {
        toast.success('No hidden injuries found', {
          description: result.message,
          duration: 3000,
        });
      } else if (result.status === 'missed') {
        toast.info('Assessment inconclusive', {
          description: result.message,
          duration: 3000,
        });
      }
    }, delay);
  };
  
  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'text-red-500 bg-red-500/20';
    if (severity >= 4) return 'text-orange-500 bg-orange-500/20';
    if (severity >= 3) return 'text-amber-500 bg-amber-500/20';
    return 'text-yellow-500 bg-yellow-500/20';
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCheckSelf('quick')}
          disabled={disabled || isChecking}
          className="gap-2 relative"
        >
          {isChecking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Stethoscope className="w-4 h-4" />
          )}
          Check Self
          {hasHiddenWounds && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </Button>
        
        {/* Quick action buttons for different thoroughness */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => handleCheckSelf('careful')}
            disabled={disabled || isChecking}
          >
            Careful
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => handleCheckSelf('thorough')}
            disabled={disabled || isChecking}
          >
            Thorough
          </Button>
        </div>
      </div>
      
      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lastResult?.status === 'clean' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  No Hidden Wounds
                </>
              ) : lastResult?.status === 'found' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Wounds Discovered!
                </>
              ) : (
                <>
                  <Stethoscope className="w-5 h-5 text-amber-500" />
                  Assessment Complete
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {lastResult?.message}
            </DialogDescription>
          </DialogHeader>
          
          {lastResult?.discoveredWounds && lastResult.discoveredWounds.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-semibold">Discovered Injuries:</h4>
              {lastResult.discoveredWounds.map((wound) => (
                <div 
                  key={wound.id} 
                  className="p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{wound.typeName}</span>
                    <Badge className={getSeverityColor(wound.severity)}>
                      Severity {wound.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground">{wound.locationName}</span>
                    {' — '}
                    {wound.hpDamage} damage
                    {wound.bleedRate > 0 && (
                      <span className="text-red-400 ml-2">
                        🩸 Bleeding ({wound.bleedRate}/min)
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              <p className="text-xs text-muted-foreground italic mt-2">
                Seek treatment to stop bleeding and prevent further damage.
              </p>
            </div>
          )}
          
          {hasRevealedUntreated && !lastResult?.discoveredWounds.length && (
            <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <p className="text-sm text-amber-200">
                You have {adrenalineState.hiddenDamage.revealedWounds.filter(w => !w.treated).length} untreated wound(s) 
                that need attention.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
