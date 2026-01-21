// ============================================================================
// COMPANION QUICK VIEW - Floating mini-cards for at-a-glance companion status
// ============================================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, AlertTriangle, ChevronUp, ChevronDown, MessageCircle, Shield, Sword, Target, Zap } from 'lucide-react';
import { CompanionState, CompanionMood, companionSystem } from '@/game/companionSystem';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

interface CompanionQuickViewProps {
  onOpenPanel?: () => void;
  onCompanionClick?: (companion: CompanionState) => void;
  className?: string;
}

// ============================================================================
// MOOD STYLING
// ============================================================================

const moodColors: Record<CompanionMood, string> = {
  joyful: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-500',
  content: 'bg-green-500/20 border-green-500/40 text-green-500',
  neutral: 'bg-muted border-border text-muted-foreground',
  annoyed: 'bg-orange-500/20 border-orange-500/40 text-orange-500',
  angry: 'bg-red-500/20 border-red-500/40 text-red-500',
  sad: 'bg-blue-500/20 border-blue-500/40 text-blue-500',
  fearful: 'bg-purple-500/20 border-purple-500/40 text-purple-500',
  disgusted: 'bg-amber-600/20 border-amber-600/40 text-amber-600',
  romantic: 'bg-pink-500/20 border-pink-500/40 text-pink-500',
  betrayed: 'bg-red-600/20 border-red-600/40 text-red-600',
};

const moodEmojis: Record<CompanionMood, string> = {
  joyful: '😊',
  content: '🙂',
  neutral: '😐',
  annoyed: '😤',
  angry: '😠',
  sad: '😢',
  fearful: '😰',
  disgusted: '😒',
  romantic: '💕',
  betrayed: '💔',
};

const roleIcons: Record<string, React.ReactNode> = {
  tank: <Shield className="w-3 h-3" />,
  damage: <Sword className="w-3 h-3" />,
  support: <Heart className="w-3 h-3" />,
  ranged: <Target className="w-3 h-3" />,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAffinityColor(affinity: number): string {
  if (affinity >= 50) return 'text-green-500';
  if (affinity >= 20) return 'text-blue-500';
  if (affinity >= 0) return 'text-muted-foreground';
  if (affinity >= -30) return 'text-orange-500';
  return 'text-red-500';
}

function getAffinityLabel(affinity: number): string {
  if (affinity >= 80) return 'Devoted';
  if (affinity >= 50) return 'Loyal';
  if (affinity >= 20) return 'Friendly';
  if (affinity >= 0) return 'Neutral';
  if (affinity >= -30) return 'Wary';
  if (affinity >= -60) return 'Hostile';
  return 'Enemy';
}

function isCompanionAtRisk(companion: CompanionState): boolean {
  const threshold = companion.personality?.departureThreshold || -30;
  return companion.affinity <= threshold + 20; // Warning zone
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompanionQuickView({ onOpenPanel, onCompanionClick, className }: CompanionQuickViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [companions, setCompanions] = useState<CompanionState[]>([]);

  useEffect(() => {
    const loadCompanions = () => {
      const active = companionSystem.getActiveCompanions();
      setCompanions(active);
    };

    loadCompanions();
    const interval = setInterval(loadCompanions, 3000);
    return () => clearInterval(interval);
  }, []);

  if (companions.length === 0) return null;

  const atRiskCount = companions.filter(isCompanionAtRisk).length;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "fixed right-4 top-20 z-30",
          className
        )}
      >
        {/* Header Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 transition-all",
            "bg-card/95 backdrop-blur-sm hover:bg-card",
            atRiskCount > 0 && "border-orange-500/50"
          )}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Companions ({companions.length})</span>
          {atRiskCount > 0 && (
            <AlertTriangle className="w-3 h-3 text-orange-500" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Companion Cards */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card/95 backdrop-blur-sm border border-t-0 rounded-b-lg rounded-tr-lg overflow-hidden"
            >
              <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                {companions.map((companion) => (
                  <CompanionMiniCard
                    key={companion.id}
                    companion={companion}
                    onClick={() => onCompanionClick?.(companion)}
                  />
                ))}
              </div>

              {/* Footer */}
              {onOpenPanel && (
                <div className="p-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={onOpenPanel}
                  >
                    Open Full Panel
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  );
}

// ============================================================================
// MINI CARD COMPONENT
// ============================================================================

interface CompanionMiniCardProps {
  companion: CompanionState;
  onClick?: () => void;
}

function CompanionMiniCard({ companion, onClick }: CompanionMiniCardProps) {
  const isAtRisk = isCompanionAtRisk(companion);
  const moodStyle = moodColors[companion.mood] || moodColors.neutral;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
        moodStyle,
        isAtRisk && "ring-1 ring-orange-500/50"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
        "bg-background/50 border border-current/30"
      )}>
        {companion.name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate text-foreground">{companion.name}</span>
          <span className="text-xs">{moodEmojis[companion.mood]}</span>
          {companion.wantsToSpeak && (
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageCircle className="w-3 h-3 text-primary animate-pulse" />
              </TooltipTrigger>
              <TooltipContent>Wants to speak</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 opacity-70">
                {roleIcons[companion.combatRole || 'damage']}
              </span>
            </TooltipTrigger>
            <TooltipContent className="capitalize">{companion.combatRole || 'Damage'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("flex items-center gap-1", getAffinityColor(companion.affinity))}>
                <Heart className="w-3 h-3" />
                {companion.affinity > 0 ? '+' : ''}{companion.affinity}
              </span>
            </TooltipTrigger>
            <TooltipContent>{getAffinityLabel(companion.affinity)}</TooltipContent>
          </Tooltip>
          {isAtRisk && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="w-3 h-3 text-orange-500" />
              </TooltipTrigger>
              <TooltipContent>Relationship at risk!</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Affinity Bar */}
      <div className="w-12 h-1.5 bg-background/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            companion.affinity >= 50 ? "bg-green-500" :
            companion.affinity >= 0 ? "bg-blue-500" :
            companion.affinity >= -30 ? "bg-orange-500" : "bg-red-500"
          )}
          style={{ width: `${Math.max(0, (companion.affinity + 100) / 2)}%` }}
        />
      </div>
    </motion.button>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CompanionQuickView;
