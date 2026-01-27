// ============================================================================
// COMPANION GOALS PANEL - Full detailed view of companion goals, morals, relationships
// ============================================================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Heart, Sword, BookOpen, Crown, Coins, Users, Eye,
  HandHelping, Ban, ChevronRight, Lock, CheckCircle, AlertTriangle,
  X, Sparkles, Shield, Scale, Flame, Star, TrendingUp, History,
  HeartHandshake, Skull, Compass
} from 'lucide-react';
import { CompanionState } from '@/game/companion/companionTypes';
import { CompanionGoal, AutonomyState } from '@/game/companion/companionAutonomy';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { deriveBeliefSystem, CompanionBeliefs } from '@/game/companionSentienceSystem';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CompanionGoalsPanelProps {
  companion: CompanionState;
  isOpen: boolean;
  onClose: () => void;
  onGoalAction?: (goalId: string, action: 'help' | 'block') => void;
}

// Goal type configuration
const GOAL_CONFIG: Record<CompanionGoal['type'], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  personal: { icon: Target, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', label: 'Personal' },
  revenge: { icon: Sword, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', label: 'Revenge' },
  redemption: { icon: Heart, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', label: 'Redemption' },
  romance: { icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', label: 'Romance' },
  wealth: { icon: Coins, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', label: 'Wealth' },
  power: { icon: Crown, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', label: 'Power' },
  knowledge: { icon: BookOpen, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', label: 'Knowledge' },
  family: { icon: Users, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', label: 'Family' },
};

// Belief system display config
const BELIEF_CONFIG: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  honor_code: { icon: Shield, label: 'Honor-Bound', description: 'Lives by a strict personal code' },
  survivalist: { icon: Compass, label: 'Survivalist', description: 'Prioritizes pragmatism and strength' },
  idealist: { icon: Star, label: 'Idealist', description: 'Believes in causes and greater good' },
  mercenary: { icon: Coins, label: 'Mercenary', description: 'Follows gold and opportunity' },
  loyalist: { icon: HeartHandshake, label: 'Loyalist', description: 'Values bonds above all else' },
  chaotic: { icon: Flame, label: 'Chaotic', description: 'Values freedom and spontaneity' },
  spiritual: { icon: Sparkles, label: 'Spiritual', description: 'Guided by faith or cosmic forces' },
  intellectual: { icon: BookOpen, label: 'Intellectual', description: 'Values knowledge and strategy' },
};

// Value bar component
function ValueBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const normalizedValue = (value + 100) / 2; // Convert -100 to 100 → 0 to 100
  const isNegative = value < 0;
  const isPositive = value > 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={cn(
          "font-mono",
          isNegative && "text-red-400",
          isPositive && "text-emerald-400",
          !isNegative && !isPositive && "text-muted-foreground"
        )}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            isNegative ? "bg-gradient-to-r from-red-500 to-red-400" :
            isPositive ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
            "bg-muted-foreground"
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

// Relationship context section
function RelationshipContext({ companion }: { companion: CompanionState }) {
  const relationshipScore = Math.round(
    (companion.trust * 0.3) + 
    (companion.respect * 0.2) + 
    ((companion.affinity + 100) / 2 * 0.3) + 
    (companion.conversationMemory.conversationDepth * 0.2)
  );
  
  const romanceActive = companion.romanticInterest >= 50 || companion.personality.romanticInterest.attractedToPlayer;
  
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/30 bg-card/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-primary" />
          Relationship Context
        </h4>
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          relationshipScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
          relationshipScore >= 40 ? "bg-amber-500/20 text-amber-400" :
          "bg-red-500/20 text-red-400"
        )}>
          {relationshipScore >= 70 ? 'Strong Bond' : relationshipScore >= 40 ? 'Growing' : 'Fragile'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Affinity</span>
            <span className={cn(
              "font-mono",
              companion.affinity >= 50 ? "text-emerald-400" :
              companion.affinity >= 0 ? "text-amber-400" :
              "text-red-400"
            )}>{companion.affinity}</span>
          </div>
          <Progress 
            value={(companion.affinity + 100) / 2} 
            className="h-1.5"
            indicatorClassName={cn(
              companion.affinity >= 50 ? "bg-emerald-500" :
              companion.affinity >= 0 ? "bg-amber-500" :
              "bg-red-500"
            )}
          />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Trust</span>
            <span className="font-mono">{companion.trust}%</span>
          </div>
          <Progress value={companion.trust} className="h-1.5" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Respect</span>
            <span className="font-mono">{companion.respect}%</span>
          </div>
          <Progress value={companion.respect} className="h-1.5" />
        </div>
        
        {romanceActive && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-pink-400">Romance</span>
              <span className="font-mono text-pink-400">{companion.romanticInterest}%</span>
            </div>
            <Progress 
              value={companion.romanticInterest} 
              className="h-1.5"
              indicatorClassName="bg-pink-500"
            />
          </div>
        )}
      </div>
      
      {/* How relationship affects goals */}
      <div className="text-xs text-muted-foreground border-t border-border/20 pt-3 mt-3">
        {companion.trust >= 70 ? (
          <p className="text-emerald-400">High trust means they share their deepest goals with you.</p>
        ) : companion.trust >= 40 ? (
          <p>Build more trust to unlock hidden goals and deeper motivations.</p>
        ) : (
          <p className="text-amber-400">Low trust hides their true intentions from you.</p>
        )}
      </div>
    </div>
  );
}

// Moral alignment section
function MoralAlignment({ companion, beliefs }: { companion: CompanionState; beliefs: CompanionBeliefs }) {
  const beliefConfig = BELIEF_CONFIG[beliefs.primaryBelief] || BELIEF_CONFIG.survivalist;
  const BeliefIcon = beliefConfig.icon;
  
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/30 bg-card/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Moral Compass
        </h4>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
          <BeliefIcon className="w-3 h-3" />
          <span>{beliefConfig.label}</span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">{beliefConfig.description}</p>
      
      <div className="space-y-2">
        <ValueBar label="Violence" value={beliefs.valueAlignment.violence} icon={Sword} />
        <ValueBar label="Honesty" value={beliefs.valueAlignment.honesty} icon={Eye} />
        <ValueBar label="Wealth" value={beliefs.valueAlignment.wealth} icon={Coins} />
        <ValueBar label="Authority" value={beliefs.valueAlignment.authority} icon={Crown} />
        <ValueBar label="Compassion" value={beliefs.valueAlignment.compassion} icon={Heart} />
      </div>
      
      {/* Dealbreakers */}
      {beliefs.dealbreakers.length > 0 && (
        <div className="border-t border-border/20 pt-3 mt-3">
          <p className="text-xs text-red-400 flex items-center gap-1.5 mb-2">
            <Skull className="w-3 h-3" />
            <span className="font-medium">Dealbreakers</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {beliefs.dealbreakers.map((action) => (
              <span 
                key={action}
                className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {action.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Goal detail card
function GoalDetailCard({ 
  goal, 
  companion,
  beliefs,
  onAction 
}: { 
  goal: CompanionGoal; 
  companion: CompanionState;
  beliefs: CompanionBeliefs;
  onAction?: (goalId: string, action: 'help' | 'block') => void;
}) {
  const config = GOAL_CONFIG[goal.type] || GOAL_CONFIG.personal;
  const Icon = config.icon;
  const isCompleted = goal.progress >= 100 || goal.completedAt;
  const isBlocked = !!goal.blockedBy;
  const isSecret = goal.isSecret && !goal.revealedAt;
  
  // Calculate goal-relationship alignment
  const goalAlignedWithRelationship = useMemo(() => {
    if (goal.type === 'romance') return companion.romanticInterest >= 50;
    if (goal.type === 'revenge') return beliefs.valueAlignment.violence > 0;
    if (goal.type === 'redemption') return beliefs.valueAlignment.compassion > 0;
    if (goal.type === 'wealth') return beliefs.valueAlignment.wealth > 0;
    if (goal.type === 'power') return beliefs.valueAlignment.authority > 0;
    return true;
  }, [goal.type, companion.romanticInterest, beliefs.valueAlignment]);
  
  const handleHelp = () => {
    if (onAction) {
      onAction(goal.id, 'help');
    } else {
      companionAutonomyManager.progressGoal(companion.id, goal.id, 15);
      toast.success(`You offered to help ${companion.name} with their goal`);
    }
  };
  
  const handleBlock = () => {
    if (onAction) {
      onAction(goal.id, 'block');
    } else {
      toast.warning(`Blocking this goal may damage your relationship with ${companion.name}`);
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-4 rounded-lg border transition-all",
        isCompleted && "opacity-60",
        isBlocked && "border-red-500/30 bg-red-500/5",
        !isCompleted && !isBlocked && config.bgColor,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2.5 rounded-lg flex-shrink-0",
          isCompleted ? "bg-emerald-500/20" : 
          isBlocked ? "bg-red-500/20" : 
          config.bgColor
        )}>
          {isCompleted ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : isBlocked ? (
            <Ban className="w-5 h-5 text-red-400" />
          ) : isSecret ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Icon className={cn("w-5 h-5", config.color)} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium">
              {isSecret ? 'Hidden Goal' : config.label}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Priority: <span className="font-mono">{goal.priority}</span>
              </span>
              {!goalAlignedWithRelationship && !isSecret && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Conflicted
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {isSecret 
              ? `Build more trust with ${companion.name} to discover this goal` 
              : goal.description}
          </p>
          
          {/* Progress */}
          {!isSecret && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Progress
                </span>
                <span className={cn(
                  "font-mono font-medium",
                  goal.progress >= 75 ? "text-emerald-400" :
                  goal.progress >= 50 ? "text-amber-400" :
                  "text-muted-foreground"
                )}>
                  {goal.progress}%
                </span>
              </div>
              <Progress 
                value={goal.progress} 
                className="h-2"
                indicatorClassName={cn(
                  goal.progress >= 75 ? "bg-emerald-500" :
                  goal.progress >= 50 ? "bg-amber-500" :
                  "bg-primary"
                )}
              />
            </div>
          )}
          
          {/* Status indicators */}
          <div className="flex items-center gap-2 mt-3">
            {goal.requiresPlayerHelp && !isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs text-primary px-2 py-0.5 rounded bg-primary/10">
                <HandHelping className="w-3 h-3" />
                Needs your help
              </span>
            )}
            {goal.willLeaveIfBlocked && !isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs text-red-400 px-2 py-0.5 rounded bg-red-500/10">
                <AlertTriangle className="w-3 h-3" />
                Will leave if blocked
              </span>
            )}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-xs text-red-400 px-2 py-0.5 rounded bg-red-500/10">
                <Ban className="w-3 h-3" />
                Blocked by: {goal.blockedBy}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {!isCompleted && !isBlocked && !isSecret && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/20">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            onClick={handleHelp}
          >
            <HandHelping className="w-4 h-4 mr-2" />
            Help with Goal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleBlock}
          >
            <Ban className="w-4 h-4 mr-2" />
            Block Goal
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Main Goals Panel Component
export function CompanionGoalsPanel({ companion, isOpen, onClose, onGoalAction }: CompanionGoalsPanelProps) {
  const [activeTab, setActiveTab] = useState('active');
  
  // Get autonomy state and beliefs
  const autonomyState = useMemo(() => {
    return companionAutonomyManager.getAutonomyState(companion.id);
  }, [companion.id]);
  
  const beliefs = useMemo(() => {
    return deriveBeliefSystem(companion.personality.traits);
  }, [companion.personality.traits]);
  
  // Separate active and completed goals
  const { activeGoals, completedGoals, secretGoals } = useMemo(() => {
    if (!autonomyState) return { activeGoals: [], completedGoals: [], secretGoals: [] };
    
    const active: CompanionGoal[] = [];
    const completed: CompanionGoal[] = [];
    const secrets: CompanionGoal[] = [];
    
    for (const goal of autonomyState.currentGoals) {
      if (goal.isSecret && !goal.revealedAt) {
        secrets.push(goal);
      } else if (goal.completedAt || goal.progress >= 100) {
        completed.push(goal);
      } else {
        active.push(goal);
      }
    }
    
    return {
      activeGoals: active.sort((a, b) => b.priority - a.priority),
      completedGoals: completed,
      secretGoals: secrets,
    };
  }, [autonomyState]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-4 pb-0 border-b border-border/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {companion.name}'s Goals & Motivations
            </DialogTitle>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <TabsList className="w-full grid grid-cols-3 bg-secondary/30">
              <TabsTrigger value="active" className="data-[state=active]:bg-primary/20">
                Active ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="morals" className="data-[state=active]:bg-primary/20">
                Morals
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary/20">
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(85vh-120px)]">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'active' && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Relationship Context */}
                  <RelationshipContext companion={companion} />
                  
                  {/* Active Goals */}
                  {activeGoals.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Active Goals
                      </h3>
                      {activeGoals.map((goal) => (
                        <GoalDetailCard
                          key={goal.id}
                          goal={goal}
                          companion={companion}
                          beliefs={beliefs}
                          onAction={onGoalAction}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No active goals</p>
                    </div>
                  )}
                  
                  {/* Secret Goals */}
                  {secretGoals.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Hidden Goals ({secretGoals.length})
                      </h3>
                      {secretGoals.map((goal) => (
                        <GoalDetailCard
                          key={goal.id}
                          goal={goal}
                          companion={companion}
                          beliefs={beliefs}
                          onAction={onGoalAction}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'morals' && (
                <motion.div
                  key="morals"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <MoralAlignment companion={companion} beliefs={beliefs} />
                  
                  {/* Personality Traits */}
                  <div className="p-4 rounded-lg border border-border/30 bg-card/50 space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Personality Traits
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {companion.personality.traits.map((trait) => (
                        <span 
                          key={trait}
                          className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/20 capitalize"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                    
                    {/* Action Preferences */}
                    <div className="border-t border-border/20 pt-3 mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Approves:</p>
                      <div className="flex flex-wrap gap-1">
                        {companion.personality.approves.map((action) => (
                          <span 
                            key={action}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400"
                          >
                            {action.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-muted-foreground font-medium mt-2">Disapproves:</p>
                      <div className="flex flex-wrap gap-1">
                        {companion.personality.disapproves.map((action) => (
                          <span 
                            key={action}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400"
                          >
                            {action.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Completed Goals */}
                  {completedGoals.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Completed Goals
                      </h3>
                      {completedGoals.map((goal) => (
                        <GoalDetailCard
                          key={goal.id}
                          goal={goal}
                          companion={companion}
                          beliefs={beliefs}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <History className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No completed goals yet</p>
                    </div>
                  )}
                  
                  {/* Loyalty Events */}
                  {autonomyState?.loyaltyEvents && autonomyState.loyaltyEvents.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Loyalty Events
                      </h3>
                      <div className="space-y-2">
                        {autonomyState.loyaltyEvents.slice(-5).reverse().map((event) => (
                          <div 
                            key={event.id}
                            className={cn(
                              "p-3 rounded-lg border text-sm",
                              event.type === 'positive' 
                                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/5 border-red-500/20 text-red-400"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{event.description}</span>
                              <span className="text-xs font-mono">
                                {event.type === 'positive' ? '+' : ''}{event.impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
