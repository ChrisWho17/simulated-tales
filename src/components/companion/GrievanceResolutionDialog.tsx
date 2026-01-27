// ============================================================================
// GRIEVANCE RESOLUTION DIALOG - Address companion grievances through dialogue
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Heart, 
  Shield, 
  MessageCircle,
  HandHeart,
  Scale,
  Frown,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { CompanionState } from '@/game/companion/companionTypes';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { companionSystem } from '@/game/companionSystem';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Grievance {
  id: string;
  description: string;
  severity: number;
}

interface ResolutionApproach {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  successChance: number; // 0-100
  affinityChange: number;
  trustChange: number;
  respectChange: number;
  dialogueSuccess: string;
  dialogueFailure: string;
}

interface GrievanceResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companion: CompanionState;
  grievance: Grievance;
  onResolved: () => void;
}

// ============================================================================
// RESOLUTION APPROACHES
// ============================================================================

const RESOLUTION_APPROACHES: ResolutionApproach[] = [
  {
    id: 'sincere_apology',
    label: 'Sincere Apology',
    icon: HandHeart,
    description: 'Genuinely acknowledge your wrongdoing and ask for forgiveness.',
    successChance: 75,
    affinityChange: 15,
    trustChange: 10,
    respectChange: 5,
    dialogueSuccess: 'looks at you with softening eyes* "I... I can see you mean it. It will take time, but I accept your apology."',
    dialogueFailure: 'shakes their head slowly* "Words are easy. I need to see change, not hear promises."',
  },
  {
    id: 'explain_reasoning',
    label: 'Explain Your Reasoning',
    icon: MessageCircle,
    description: 'Help them understand why you made that choice.',
    successChance: 55,
    affinityChange: 5,
    trustChange: 5,
    respectChange: 10,
    dialogueSuccess: 'considers your words carefully* "I... I hadn\'t thought of it that way. I still don\'t like it, but I understand."',
    dialogueFailure: 'crosses their arms* "Understanding your reasoning doesn\'t make it right."',
  },
  {
    id: 'promise_change',
    label: 'Promise to Change',
    icon: Sparkles,
    description: 'Commit to behaving differently in the future.',
    successChance: 45,
    affinityChange: 10,
    trustChange: -5,
    respectChange: 0,
    dialogueSuccess: 'nods cautiously* "I\'ll hold you to that. Don\'t make me regret giving you another chance."',
    dialogueFailure: 'sighs heavily* "Promises are cheap. I\'ve heard too many already."',
  },
  {
    id: 'offer_compensation',
    label: 'Offer Compensation',
    icon: Scale,
    description: 'Propose making it up to them in a tangible way.',
    successChance: 65,
    affinityChange: 8,
    trustChange: 8,
    respectChange: -5,
    dialogueSuccess: 'raises an eyebrow but nods* "That\'s... fair. Actions speak louder than words."',
    dialogueFailure: 'looks disappointed* "You think you can just buy your way out of this?"',
  },
  {
    id: 'shared_vulnerability',
    label: 'Share Vulnerability',
    icon: Heart,
    description: 'Open up about your own struggles and fears.',
    successChance: 60,
    affinityChange: 20,
    trustChange: 15,
    respectChange: 0,
    dialogueSuccess: 'expression softens* "I didn\'t know you were carrying that. Thank you for trusting me."',
    dialogueFailure: 'looks away* "I appreciate the honesty, but it doesn\'t change what happened."',
  },
  {
    id: 'stand_your_ground',
    label: 'Stand Your Ground',
    icon: Shield,
    description: 'Defend your decision firmly without apologizing.',
    successChance: 25,
    affinityChange: -10,
    trustChange: -5,
    respectChange: 15,
    dialogueSuccess: 'grudgingly nods* "I don\'t agree, but I respect that you have convictions."',
    dialogueFailure: 'glares* "Your stubbornness will cost us both."',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function GrievanceResolutionDialog({
  open,
  onOpenChange,
  companion,
  grievance,
  onResolved,
}: GrievanceResolutionDialogProps) {
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; dialogue: string } | null>(null);

  // Calculate modified success chances based on companion stats and personality
  const modifiedApproaches = useMemo(() => {
    return RESOLUTION_APPROACHES.map(approach => {
      let modifiedChance = approach.successChance;

      // Trust modifier: High trust = better chances
      if (companion.trust > 60) modifiedChance += 15;
      else if (companion.trust < 30) modifiedChance -= 15;

      // Affinity modifier
      if (companion.affinity > 50) modifiedChance += 10;
      else if (companion.affinity < 0) modifiedChance -= 20;

      // Severity modifier: Higher severity = harder to resolve
      modifiedChance -= Math.floor(grievance.severity / 10);

      // Personality-specific modifiers (using valid PersonalityTrait values)
      if (companion.personality.traits.includes('forgiving')) modifiedChance += 20;
      if (companion.personality.traits.includes('ruthless')) modifiedChance -= 15; // Harder to convince
      if (companion.personality.traits.includes('kind') && approach.id === 'shared_vulnerability') modifiedChance += 15;
      if (companion.personality.traits.includes('honorable') && approach.id === 'stand_your_ground') modifiedChance += 20;
      if (companion.personality.traits.includes('pragmatic') && approach.id === 'offer_compensation') modifiedChance += 15;
      if (companion.personality.traits.includes('vengeful')) modifiedChance -= 20; // Very hard to forgive

      return {
        ...approach,
        successChance: Math.max(5, Math.min(95, modifiedChance)),
      };
    });
  }, [companion, grievance.severity]);

  const handleResolve = () => {
    if (!selectedApproach) return;

    const approach = modifiedApproaches.find(a => a.id === selectedApproach);
    if (!approach) return;

    setIsResolving(true);

    // Simulate resolution with calculated success chance
    setTimeout(() => {
      const roll = Math.random() * 100;
      const success = roll < approach.successChance;

      if (success) {
        // Apply positive effects
        companionSystem.adjustAffinity(companion.id, approach.affinityChange);
        companionSystem.adjustTrust(companion.id, approach.trustChange);
        companionSystem.adjustRespect(companion.id, approach.respectChange);
        companionAutonomyManager.resolveGrievance(companion.id, grievance.id, true);

        setResult({
          success: true,
          dialogue: `*${companion.name} ${approach.dialogueSuccess}`,
        });

        toast.success('Grievance Resolved', {
          description: `${companion.name} has forgiven you.`,
        });
      } else {
        // Apply partial negative effects
        companionSystem.adjustAffinity(companion.id, Math.floor(approach.affinityChange / -2));
        companionSystem.adjustTrust(companion.id, -5);
        
        // Mark as addressed but not forgiven
        companionAutonomyManager.resolveGrievance(companion.id, grievance.id, false);

        setResult({
          success: false,
          dialogue: `*${companion.name} ${approach.dialogueFailure}`,
        });

        toast.error('Resolution Failed', {
          description: `${companion.name} wasn't convinced.`,
        });
      }

      setIsResolving(false);
    }, 1000);
  };

  const handleClose = () => {
    if (result) {
      onResolved();
    }
    setSelectedApproach(null);
    setResult(null);
    onOpenChange(false);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 70) return 'text-red-400';
    if (severity >= 40) return 'text-amber-400';
    return 'text-yellow-400';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 70) return 'Critical';
    if (severity >= 40) return 'Serious';
    return 'Minor';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Address Grievance with {companion.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you want to approach this conversation
          </DialogDescription>
        </DialogHeader>

        {/* Grievance Details */}
        <div className="rounded-lg border border-border/50 bg-background/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Frown className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                {grievance.description}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <Badge 
              variant="outline" 
              className={cn('border-current', getSeverityColor(grievance.severity))}
            >
              {getSeverityLabel(grievance.severity)} Issue
            </Badge>
            <span className="text-muted-foreground">
              Severity: {grievance.severity}/100
            </span>
          </div>
        </div>

        {!result ? (
          <>
            {/* Resolution Approaches */}
            <ScrollArea className="max-h-[300px] pr-2">
              <RadioGroup
                value={selectedApproach || ''}
                onValueChange={setSelectedApproach}
                className="space-y-2"
              >
                {modifiedApproaches.map((approach) => {
                  const Icon = approach.icon;
                  return (
                    <Label
                      key={approach.id}
                      htmlFor={approach.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        selectedApproach === approach.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 bg-background/30 hover:bg-background/50'
                      )}
                    >
                      <RadioGroupItem value={approach.id} id={approach.id} className="mt-1" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{approach.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {approach.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">Success:</span>
                          <Progress 
                            value={approach.successChance} 
                            className="h-1.5 flex-1 max-w-24"
                          />
                          <span className={cn(
                            'text-xs font-medium',
                            approach.successChance >= 60 ? 'text-emerald-400' :
                            approach.successChance >= 40 ? 'text-amber-400' : 'text-red-400'
                          )}>
                            {approach.successChance}%
                          </span>
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={!selectedApproach || isResolving}
                className="flex-1 gap-2"
              >
                {isResolving ? (
                  <>
                    <span className="animate-pulse">Speaking...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Begin Conversation
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Result Display */
          <div className="space-y-4">
            <div className={cn(
              'rounded-lg border p-4',
              result.success 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            )}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="h-5 w-5 text-red-400 shrink-0" />
                )}
                <p className="text-sm italic leading-relaxed">
                  {result.dialogue}
                </p>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
