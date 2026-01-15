// Enhanced NPC Relationship Card with 3-Meter System visualization
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Shield, Crown, Users, ChevronDown, ChevronUp,
  Sparkles, MessageCircle, AlertTriangle, Eye, Flame, Star
} from 'lucide-react';
import { NPC } from '@/types/game';
import { 
  calculateRelationshipDisplay, 
  getRelationshipStatusLabel,
  getRomanceLevelLabel,
  getTensionDescription,
  RelationshipDisplayData
} from '@/lib/relationshipSystem';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedRelationshipCardProps {
  npc: NPC;
  onTalk?: (npc: NPC) => void;
  onViewProfile?: (npc: NPC) => void;
  compact?: boolean;
  className?: string;
}

export function EnhancedRelationshipCard({ 
  npc, 
  onTalk,
  onViewProfile,
  compact = false,
  className 
}: EnhancedRelationshipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const relData = calculateRelationshipDisplay(npc);
  const statusLabel = getRelationshipStatusLabel(relData.status);
  const romanceLabel = getRomanceLevelLabel(relData.romanceLevel);
  const tensions = relData.tensionFlags.filter(t => t !== 'none');

  // 3-Meter icons with descriptions
  const meters = [
    { 
      key: 'trust', 
      label: 'Trust', 
      value: relData.trust, 
      icon: Shield, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-400',
      description: 'Will they believe you?'
    },
    { 
      key: 'respect', 
      label: 'Respect', 
      value: relData.respect, 
      icon: Crown, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-400',
      description: 'Will they follow you?'
    },
    { 
      key: 'attachment', 
      label: 'Attachment', 
      value: relData.attachment, 
      icon: Heart, 
      color: 'text-rose-400',
      bgColor: 'bg-rose-400',
      description: 'Will they miss you?'
    },
  ];

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 transition-colors cursor-pointer",
          className
        )}
        onClick={() => onViewProfile?.(npc)}
      >
        {/* Mini portrait */}
        <div 
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0"
          style={{ 
            borderColor: relData.colors.primary,
            background: relData.colors.gradient
          }}
        >
          {npc.meta?.name?.charAt(0) || '?'}
        </div>
        
        {/* Name and status */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{npc.meta?.name || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground" style={{ color: relData.colors.primary }}>
            {statusLabel}
          </span>
        </div>
        
        {/* Quick meters */}
        <div className="flex gap-1">
          {meters.map(m => (
            <div 
              key={m.key}
              className={cn("w-1.5 h-6 rounded-full bg-muted/30 overflow-hidden flex flex-col-reverse")}
              title={`${m.label}: ${Math.round(m.value)}`}
            >
              <div 
                className={cn("w-full transition-all", m.bgColor)}
                style={{ height: `${Math.max(0, Math.min(100, m.value))}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border overflow-hidden transition-all",
        relData.romance > 40 ? "border-pink-500/30" : "border-border/40",
        className
      )}
      style={{
        boxShadow: relData.romance > 30 
          ? `0 0 20px ${relData.colors.glow}`
          : undefined
      }}
    >
      {/* Header */}
      <div 
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Portrait */}
        <div 
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold shrink-0 relative"
          style={{ 
            borderColor: relData.colors.primary,
            background: relData.colors.gradient
          }}
        >
          {npc.meta?.name?.charAt(0) || '?'}
          
          {/* Romance indicator */}
          {relData.romance >= 60 && (
            <motion.div
              className="absolute -bottom-1 -right-1"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="h-4 w-4 text-pink-500" />
            </motion.div>
          )}
          {relData.romance >= 30 && relData.romance < 60 && (
            <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-400" />
          )}
          {relData.overall >= 60 && relData.romance < 30 && (
            <Star className="absolute -bottom-1 -right-1 h-4 w-4 text-yellow-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="font-semibold text-sm truncate cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile?.(npc);
              }}
            >
              {npc.meta?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: relData.colors.primary }}>{statusLabel}</span>
            {romanceLabel && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-pink-400 flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {romanceLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* 3-Meter Display - Always visible */}
      <div className="px-3 pb-3 grid grid-cols-3 gap-2">
        {meters.map(meter => {
          const Icon = meter.icon;
          const normalizedValue = Math.max(0, Math.min(100, meter.value));
          
          return (
            <div key={meter.key} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Icon className={cn("h-3.5 w-3.5", meter.color)} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {meter.label}
                </span>
              </div>
              <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${normalizedValue}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn("absolute inset-y-0 left-0 rounded-full", meter.bgColor)}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{Math.round(meter.value)}</span>
            </div>
          );
        })}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
              {/* Tension indicators */}
              {tensions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="font-medium">Relationship Tensions</span>
                  </div>
                  {tensions.map(tension => (
                    <p key={tension} className="text-xs text-muted-foreground pl-5 italic">
                      "{getTensionDescription(tension)}"
                    </p>
                  ))}
                </div>
              )}

              {/* Additional meters if romance unlocked */}
              {relData.romanceUnlocked && (
                <div className="grid grid-cols-2 gap-2">
                  <MiniMeter label="Attraction" value={relData.attraction} color="text-pink-400" />
                  <MiniMeter label="Familiarity" value={relData.familiarity} color="text-green-400" />
                  <MiniMeter label="Intimacy" value={relData.intimacy} color="text-purple-400" />
                  <MiniMeter label="Romance" value={relData.romance} color="text-rose-500" />
                </div>
              )}

              {/* Fear meter (if relevant) */}
              {relData.fear > 20 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Eye className="h-4 w-4 text-red-400" />
                  <div className="flex-1">
                    <span className="text-xs text-red-400">They fear you</span>
                    <Progress value={Math.min(100, relData.fear)} className="h-1.5 mt-1" />
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 pt-1">
                {onTalk && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTalk(npc);
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Talk
                  </Button>
                )}
                {onViewProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile(npc);
                    }}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Profile
                  </Button>
                )}
              </div>

              {/* Romance hint */}
              {relData.romanceUnlocked && relData.romance > 0 && relData.romance < 80 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                  <Sparkles className="h-4 w-4 text-pink-400" />
                  <span className="text-xs text-pink-300">
                    {relData.romance < 25 
                      ? "There's potential here..." 
                      : relData.romance < 50 
                        ? "Sparks are flying!" 
                        : "Something special is growing..."}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MiniMeterProps {
  label: string;
  value: number;
  color: string;
}

function MiniMeter({ label, value, color }: MiniMeterProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className={cn("font-medium", color)}>{label}</span>
        <span className="text-muted-foreground">{Math.round(value)}</span>
      </div>
      <Progress value={normalizedValue} className="h-1" />
    </div>
  );
}

export default EnhancedRelationshipCard;
