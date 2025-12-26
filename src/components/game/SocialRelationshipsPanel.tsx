import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Users, MessageCircle, Gift, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Sparkles, Star, Flame
} from 'lucide-react';
import { NPC } from '@/types/game';
import { 
  calculateRelationshipDisplay, 
  getRelationshipStatusLabel,
  getRomanceLevelLabel,
  RelationshipDisplayData
} from '@/lib/relationshipSystem';
import { 
  SocialInteraction, 
  getAvailableInteractions,
  FRIENDLY_INTERACTIONS,
  ROMANTIC_INTERACTIONS 
} from '@/game/lifeSim/socialInteractions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SocialRelationshipsPanelProps {
  npcs: NPC[];
  onInteract?: (npc: NPC, interaction: SocialInteraction) => void;
  onSelectNPC?: (npc: NPC) => void;
  className?: string;
}

type RelationshipCategory = 'all' | 'friends' | 'romantic' | 'acquaintances';

export function SocialRelationshipsPanel({ 
  npcs, 
  onInteract,
  onSelectNPC,
  className 
}: SocialRelationshipsPanelProps) {
  const [category, setCategory] = useState<RelationshipCategory>('all');
  const [expandedNPC, setExpandedNPC] = useState<string | null>(null);

  // Process NPCs with relationship data
  const processedNPCs = npcs.map(npc => ({
    npc,
    relData: calculateRelationshipDisplay(npc)
  })).sort((a, b) => {
    // Sort by romance level first, then by overall
    if (a.relData.romance !== b.relData.romance) {
      return b.relData.romance - a.relData.romance;
    }
    return b.relData.overall - a.relData.overall;
  });

  // Filter by category
  const filteredNPCs = processedNPCs.filter(({ relData }) => {
    switch (category) {
      case 'friends':
        return relData.overall >= 30 && relData.romance < 25;
      case 'romantic':
        return relData.romance >= 10 || relData.romanceUnlocked;
      case 'acquaintances':
        return relData.overall >= -10 && relData.overall < 30 && relData.romance < 10;
      default:
        return true;
    }
  });

  const categories: { id: RelationshipCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Users className="h-3 w-3" /> },
    { id: 'friends', label: 'Friends', icon: <ThumbsUp className="h-3 w-3" /> },
    { id: 'romantic', label: 'Romantic', icon: <Heart className="h-3 w-3" /> },
    { id: 'acquaintances', label: 'Acquaintances', icon: <MessageCircle className="h-3 w-3" /> },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-background/80 backdrop-blur-sm border border-border/30 rounded-lg overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Social Relationships
        </h3>
        
        {/* Category tabs */}
        <div className="flex gap-1 mt-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={category === cat.id ? "default" : "ghost"}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setCategory(cat.id)}
            >
              {cat.icon}
              <span className="ml-1">{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* NPC List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredNPCs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No relationships in this category yet
            </div>
          ) : (
            filteredNPCs.map(({ npc, relData }) => (
              <RelationshipCard
                key={npc.id}
                npc={npc}
                relData={relData}
                expanded={expandedNPC === npc.id}
                onToggle={() => setExpandedNPC(expandedNPC === npc.id ? null : npc.id)}
                onInteract={onInteract}
                onSelect={onSelectNPC}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick stats footer */}
      <div className="p-2 border-t border-border/30 bg-muted/20">
        <div className="flex justify-around text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {processedNPCs.length} known
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3 text-green-500" />
            {processedNPCs.filter(p => p.relData.overall >= 30).length} friends
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" />
            {processedNPCs.filter(p => p.relData.romance >= 25).length} romantic
          </span>
        </div>
      </div>
    </div>
  );
}

interface RelationshipCardProps {
  npc: NPC;
  relData: RelationshipDisplayData;
  expanded: boolean;
  onToggle: () => void;
  onInteract?: (npc: NPC, interaction: SocialInteraction) => void;
  onSelect?: (npc: NPC) => void;
}

function RelationshipCard({ 
  npc, 
  relData, 
  expanded, 
  onToggle,
  onInteract,
  onSelect 
}: RelationshipCardProps) {
  const statusLabel = getRelationshipStatusLabel(relData.status);
  const romanceLabel = getRomanceLevelLabel(relData.romanceLevel);

  // Get available interactions for this NPC
  const availableInteractions = getAvailableInteractions({
    intimacy: relData.intimacy,
    trust: relData.trust,
    respect: relData.respect,
    attraction: relData.attraction,
    romance: relData.romance,
    drama: 0,
    isRomanceable: relData.romanceUnlocked,
    romanticType: relData.romanceLevel !== 'none' ? relData.romanceLevel : null
  });

  const quickInteractions = availableInteractions.slice(0, 4);

  return (
    <motion.div
      layout
      className="bg-card/60 border border-border/40 rounded-lg overflow-hidden"
      style={{
        boxShadow: relData.romance > 30 
          ? `0 0 12px ${relData.colors.glow}`
          : undefined
      }}
    >
      {/* Main row */}
      <div 
        className="p-2 flex items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        {/* Portrait placeholder */}
        <div 
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg shrink-0"
          style={{ 
            borderColor: relData.colors.primary,
            background: relData.colors.gradient
          }}
        >
          {npc.meta?.name?.charAt(0) || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span 
              className="font-medium text-sm truncate cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(npc);
              }}
            >
              {npc.meta?.name || 'Unknown'}
            </span>
            {relData.romance >= 60 && <Flame className="h-3 w-3 text-pink-500" />}
            {relData.romance >= 40 && relData.romance < 60 && <Heart className="h-3 w-3 text-pink-400" />}
            {relData.overall >= 60 && relData.romance < 40 && <Star className="h-3 w-3 text-yellow-500" />}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span style={{ color: relData.colors.primary }}>{statusLabel}</span>
            {romanceLabel && (
              <>
                <span>•</span>
                <span className="text-pink-400">{romanceLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
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
            <div className="p-3 pt-0 space-y-3 border-t border-border/30">
              {/* Relationship meters */}
              <div className="grid grid-cols-2 gap-2">
                <RelationshipMeter label="Trust" value={relData.trust} color="text-blue-400" />
                <RelationshipMeter label="Respect" value={relData.respect} color="text-amber-400" />
                <RelationshipMeter label="Familiarity" value={relData.familiarity} color="text-green-400" />
                <RelationshipMeter label="Attraction" value={relData.attraction} color="text-pink-400" />
                {relData.romanceUnlocked && (
                  <>
                    <RelationshipMeter label="Romance" value={relData.romance} color="text-rose-500" />
                    <RelationshipMeter label="Intimacy" value={relData.intimacy} color="text-purple-400" />
                  </>
                )}
              </div>

              {/* Quick interactions */}
              {quickInteractions.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Quick Actions</div>
                  <div className="flex flex-wrap gap-1">
                    {quickInteractions.map(interaction => (
                      <Button
                        key={interaction.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInteract?.(npc, interaction);
                        }}
                      >
                        <span className="mr-1">{interaction.icon}</span>
                        {interaction.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Romance status */}
              {relData.romanceUnlocked && relData.romance > 0 && (
                <div className="flex items-center gap-2 p-2 bg-pink-500/10 rounded border border-pink-500/20">
                  <Sparkles className="h-4 w-4 text-pink-400" />
                  <span className="text-xs text-pink-300">
                    Romance is blooming! Current level: {romanceLabel || 'Potential'}
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

interface RelationshipMeterProps {
  label: string;
  value: number;
  color: string;
}

function RelationshipMeter({ label, value, color }: RelationshipMeterProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className={cn("font-medium", color)}>{label}</span>
        <span className="text-muted-foreground">{Math.round(value)}</span>
      </div>
      <Progress 
        value={normalizedValue} 
        className="h-1.5"
      />
    </div>
  );
}
