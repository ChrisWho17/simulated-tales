// ============================================================================
// COMPANION GOAL TRACKER - Shows active companion goals with help/block options
// ============================================================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Heart, Sword, BookOpen, Crown, Coins, Users, Eye,
  HandHelping, Ban, ChevronRight, Lock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { CompanionState } from '@/game/companion/companionTypes';
import { CompanionGoal } from '@/game/companion/companionAutonomy';
import { companionAutonomyManager } from '@/game/companion/companionAutonomyIntegration';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CompanionGoalTrackerProps {
  companion: CompanionState;
  compact?: boolean;
  onGoalAction?: (goalId: string, action: 'help' | 'block') => void;
}

// Goal type configuration
const GOAL_CONFIG: Record<CompanionGoal['type'], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  personal: { icon: Target, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  revenge: { icon: Sword, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  redemption: { icon: Heart, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  romance: { icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  wealth: { icon: Coins, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  power: { icon: Crown, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  knowledge: { icon: BookOpen, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  family: { icon: Users, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
};

// Single goal item
function GoalItem({ 
  goal, 
  companionId,
  compact,
  onAction 
}: { 
  goal: CompanionGoal; 
  companionId: string;
  compact?: boolean;
  onAction?: (goalId: string, action: 'help' | 'block') => void;
}) {
  const config = GOAL_CONFIG[goal.type] || GOAL_CONFIG.personal;
  const Icon = config.icon;
  const isCompleted = goal.progress >= 100 || goal.completedAt;
  const isBlocked = !!goal.blockedBy;
  
  const handleHelp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(goal.id, 'help');
    } else {
      // Default behavior - boost progress
      companionAutonomyManager.progressGoal(companionId, goal.id, 15);
      toast.success(`You offered to help with "${goal.description.slice(0, 30)}..."`);
    }
  };
  
  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(goal.id, 'block');
    } else {
      toast.warning(`You chose to block this goal. This may damage your relationship.`);
    }
  };
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg border cursor-help",
              config.bgColor,
              "border-border/30"
            )}>
              <Icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {goal.isSecret && !goal.revealedAt ? '???' : goal.description}
                </p>
                <Progress value={goal.progress} className="h-1 mt-1" />
              </div>
              <span className={cn(
                "text-xs font-mono",
                goal.progress >= 75 ? "text-emerald-400" :
                goal.progress >= 50 ? "text-amber-400" :
                "text-muted-foreground"
              )}>
                {goal.progress}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[200] bg-popover border border-border/50 max-w-64">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className="font-medium capitalize">{goal.type} Goal</span>
              </div>
              <p className="text-xs text-muted-foreground">{goal.description}</p>
              {goal.requiresPlayerHelp && (
                <p className="text-xs text-primary">Requires your assistance</p>
              )}
              {goal.willLeaveIfBlocked && (
                <p className="text-xs text-red-400">May leave if blocked</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        isCompleted && "opacity-60",
        isBlocked && "border-red-500/30 bg-red-500/5",
        !isCompleted && !isBlocked && config.bgColor,
        "border-border/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0",
          isCompleted ? "bg-emerald-500/20" : 
          isBlocked ? "bg-red-500/20" : 
          config.bgColor
        )}>
          {isCompleted ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : isBlocked ? (
            <Ban className="w-4 h-4 text-red-400" />
          ) : goal.isSecret && !goal.revealedAt ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Icon className={cn("w-4 h-4", config.color)} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium capitalize">
              {goal.isSecret && !goal.revealedAt ? 'Hidden Goal' : goal.type}
            </h4>
            <span className="text-xs text-muted-foreground">
              Priority: {goal.priority}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            {goal.isSecret && !goal.revealedAt 
              ? 'Build more trust to discover this goal' 
              : goal.description}
          </p>
          
          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className={cn(
                "font-mono",
                goal.progress >= 75 ? "text-emerald-400" :
                goal.progress >= 50 ? "text-amber-400" :
                "text-muted-foreground"
              )}>
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} className="h-1.5" />
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2 mt-2">
            {goal.requiresPlayerHelp && !isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <HandHelping className="w-3 h-3" />
                Needs help
              </span>
            )}
            {goal.willLeaveIfBlocked && !isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                Critical
              </span>
            )}
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                <Ban className="w-3 h-3" />
                Blocked
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      {!isCompleted && !isBlocked && !goal.isSecret && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            onClick={handleHelp}
          >
            <HandHelping className="w-3 h-3 mr-1.5" />
            Help
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleBlock}
          >
            <Ban className="w-3 h-3 mr-1.5" />
            Block
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Main Goal Tracker Component
export function CompanionGoalTracker({ companion, compact, onGoalAction }: CompanionGoalTrackerProps) {
  // Get goals from autonomy state
  const goals = useMemo(() => {
    const autonomyState = companionAutonomyManager.getAutonomyState(companion.id);
    if (!autonomyState) return [];
    return autonomyState.currentGoals.filter(g => !g.completedAt);
  }, [companion.id]);
  
  if (goals.length === 0) {
    if (compact) return null;
    
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Target className="w-6 h-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No active goals</p>
      </div>
    );
  }
  
  // Sort by priority
  const sortedGoals = [...goals].sort((a, b) => b.priority - a.priority);
  
  if (compact) {
    // Show only top 2 goals in compact mode
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Target className="w-3 h-3" />
          <span>Active Goals ({goals.length})</span>
        </div>
        <div className="space-y-1.5">
          {sortedGoals.slice(0, 2).map((goal) => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              companionId={companion.id}
              compact 
              onAction={onGoalAction}
            />
          ))}
          {goals.length > 2 && (
            <p className="text-xs text-muted-foreground text-center">
              +{goals.length - 2} more goals
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Personal Goals</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {goals.length} active
        </span>
      </div>
      
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {sortedGoals.map((goal) => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              companionId={companion.id}
              onAction={onGoalAction}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
