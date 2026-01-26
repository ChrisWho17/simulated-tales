// ============================================================================
// COMPANION RELATIONSHIP SUMMARY
// Shows first impression calculation for newly created companion
// ============================================================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, ThumbsUp, ThumbsDown, AlertTriangle, 
  Sparkles, Scale, Shield, Swords, Users, Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PersonalityTrait } from '@/game/companionSystem';
import { 
  deriveBeliefSystem, 
  calculateFirstImpression, 
  evaluateJoiningDecision,
  ImpressionLevel,
  FirstImpression,
  JoiningDecision,
  CompanionBeliefs
} from '@/game/companionSentienceSystem';
import { CompanionState } from '@/game/companion/companionTypes';
import { RPGCharacter } from '@/types/rpgCharacter';

interface CompanionRelationshipSummaryProps {
  name: string;
  traits: PersonalityTrait[];
  worldview: {
    trustInOthers: number;
    beliefInFate: number;
    valueOfLife: number;
    viewOfAuthority: number;
  };
  playerCharacter?: RPGCharacter;
  existingCompanions?: CompanionState[];
}

// Impression level styling
const IMPRESSION_STYLES: Record<ImpressionLevel, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  critical: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Hostile',
  },
  bad: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: <ThumbsDown className="w-5 h-5" />,
    label: 'Reluctant',
  },
  neutral: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border',
    icon: <Scale className="w-5 h-5" />,
    label: 'Undecided',
  },
  good: {
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    icon: <ThumbsUp className="w-5 h-5" />,
    label: 'Interested',
  },
  praised: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: <Sparkles className="w-5 h-5" />,
    label: 'Eager',
  },
};

// Belief system descriptions
const BELIEF_DESCRIPTIONS: Record<string, string> = {
  honor_code: 'Follows a strict personal code of honor',
  survivalist: 'Pragmatic and focused on survival',
  idealist: 'Believes in greater causes and justice',
  mercenary: 'Motivated by profit and opportunity',
  loyalist: 'Values bonds and loyalty above all',
  chaotic: 'Unpredictable and values freedom',
  spiritual: 'Guided by faith and cosmic forces',
  intellectual: 'Driven by knowledge and strategy',
};

export function CompanionRelationshipSummary({
  name,
  traits,
  worldview,
  playerCharacter,
  existingCompanions = [],
}: CompanionRelationshipSummaryProps) {
  // Calculate beliefs and first impression
  const { beliefs, impression, decision, partyDynamics } = useMemo(() => {
    const derivedBeliefs = deriveBeliefSystem(traits);
    
    // Build a mock companion state for calculation
    const mockCompanion: Partial<CompanionState> = {
      id: 'preview',
      name,
      personality: {
        traits,
        values: {
          honor: worldview.viewOfAuthority > 50 ? 50 : -30,
          wealth: 0,
          power: 0,
          love: worldview.trustInOthers > 50 ? 30 : -20,
          freedom: worldview.viewOfAuthority < 50 ? 50 : 0,
          justice: 0,
          knowledge: 0,
          family: 0,
        },
        approves: [],
        disapproves: [],
        romanticInterest: { enabled: false, attractedToPlayer: false, romanceThreshold: 50 },
        betrayalThreshold: -50,
        departureThreshold: -30,
        speechPattern: '',
        catchphrases: [],
        quirks: [],
        hiddenQuirks: [],
      },
    };
    
    // Get player reputation (mock for preview)
    const playerRep = playerCharacter ? {
      honor: 30 + Math.floor(Math.random() * 40),
      kindness: 20 + Math.floor(Math.random() * 30),
      wealth: 100,
    } : undefined;
    
    const calculatedImpression = calculateFirstImpression(
      traits,
      derivedBeliefs,
      playerCharacter,
      playerRep
    );
    
    const joiningDecision = evaluateJoiningDecision(
      mockCompanion as CompanionState,
      derivedBeliefs,
      calculatedImpression,
      playerRep
    );
    
    // Calculate party dynamics
    const dynamics: { companion: string; relationship: 'ally' | 'neutral' | 'tension'; reason: string }[] = [];
    
    for (const existing of existingCompanions) {
      if (!existing.personality?.traits) continue;
      
      const existingTraits = existing.personality.traits;
      let relationship: 'ally' | 'neutral' | 'tension' = 'neutral';
      let reason = 'No strong feelings';
      
      // Check for trait synergies
      const hasSharedTrait = traits.some(t => existingTraits.includes(t));
      const hasOpposingTraits = (
        (traits.includes('honorable') && existingTraits.includes('treacherous')) ||
        (traits.includes('kind') && existingTraits.includes('cruel')) ||
        (traits.includes('brave') && existingTraits.includes('cowardly')) ||
        (traits.includes('generous') && existingTraits.includes('greedy'))
      );
      
      if (hasOpposingTraits) {
        relationship = 'tension';
        reason = 'Opposing values will cause friction';
      } else if (hasSharedTrait) {
        relationship = 'ally';
        const shared = traits.find(t => existingTraits.includes(t));
        reason = `Shares ${shared} nature`;
      }
      
      dynamics.push({
        companion: existing.name,
        relationship,
        reason,
      });
    }
    
    return {
      beliefs: derivedBeliefs,
      impression: calculatedImpression,
      decision: joiningDecision,
      partyDynamics: dynamics,
    };
  }, [name, traits, worldview, playerCharacter, existingCompanions]);

  const style = IMPRESSION_STYLES[impression.level];
  const impressionPercentage = ((impression.score + 100) / 200) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-lg border',
        style.bgColor,
        style.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-full', style.bgColor, style.color)}>
            {style.icon}
          </div>
          <div>
            <h4 className={cn('font-semibold', style.color)}>
              First Impression: {style.label}
            </h4>
            <p className="text-xs text-muted-foreground">
              How {name} feels about joining you
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn('capitalize', style.color)}>
          {impression.level}
        </Badge>
      </div>

      {/* Impression Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Hostile</span>
          <span className="font-medium">{impression.score > 0 ? '+' : ''}{impression.score}</span>
          <span>Eager</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${impressionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              impression.score < -20 ? 'bg-destructive' :
              impression.score < 20 ? 'bg-muted-foreground' :
              impression.score < 50 ? 'bg-primary' : 'bg-green-500'
            )}
          />
          {/* Center marker */}
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-foreground/30" />
        </div>
      </div>

      {/* Belief System */}
      <div className="mb-4 p-3 rounded-md bg-background/50">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Core Belief System</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {beliefs.primaryBelief.replace('_', ' ')}
          </Badge>
          {beliefs.secondaryBelief && (
            <Badge variant="outline" className="capitalize">
              {beliefs.secondaryBelief.replace('_', ' ')}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {BELIEF_DESCRIPTIONS[beliefs.primaryBelief]}
        </p>
      </div>

      {/* Impression Factors */}
      {impression.factors.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Scale className="w-4 h-4" /> Impression Factors
          </h5>
          <div className="space-y-1.5">
            {impression.factors.slice(0, 4).map((factor, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold',
                    factor.value > 0 ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
                  )}>
                    {factor.value > 0 ? '+' : ''}{factor.value}
                  </span>
                  <span className="text-muted-foreground">{factor.source}</span>
                </div>
                <span className="text-muted-foreground/70 capitalize text-[10px]">
                  {factor.category}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Joining Decision */}
      <div className={cn(
        'p-3 rounded-md border',
        decision.willJoin 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-orange-500/10 border-orange-500/30'
      )}>
        <div className="flex items-start gap-2">
          {decision.willJoin ? (
            <ThumbsUp className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium">
              {decision.willJoin ? 'Likely to Join' : 'May Need Convincing'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {decision.reason}
            </p>
            {decision.alternativeCondition && !decision.willJoin && (
              <p className="text-xs text-primary mt-2 italic">
                Tip: {decision.alternativeCondition}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Party Dynamics */}
      {partyDynamics.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Party Dynamics
          </h5>
          <div className="space-y-2">
            {partyDynamics.map((dynamic, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md text-xs',
                  dynamic.relationship === 'ally' ? 'bg-green-500/10' :
                  dynamic.relationship === 'tension' ? 'bg-destructive/10' :
                  'bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2">
                  {dynamic.relationship === 'ally' && <Heart className="w-3 h-3 text-green-400" />}
                  {dynamic.relationship === 'tension' && <Swords className="w-3 h-3 text-destructive" />}
                  {dynamic.relationship === 'neutral' && <Shield className="w-3 h-3 text-muted-foreground" />}
                  <span className="font-medium">{dynamic.companion}</span>
                </div>
                <span className="text-muted-foreground">{dynamic.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default CompanionRelationshipSummary;
