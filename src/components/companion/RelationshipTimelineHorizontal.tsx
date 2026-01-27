// ============================================================================
// RELATIONSHIP TIMELINE (HORIZONTAL) - Visual timeline of trust/affinity changes
// ============================================================================

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Heart, Shield, Star, Flame,
  HandHeart, Skull, Swords, MessageCircle, Gift, ChevronLeft, ChevronRight
} from 'lucide-react';
import { CompanionState, CompanionMemory } from '@/game/companion/companionTypes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationshipTimelineHorizontalProps {
  companion: CompanionState;
}

interface TimelineNode {
  id: string;
  timestamp: number;
  type: 'join' | 'positive' | 'negative' | 'major_positive' | 'major_negative' | 'betrayal' | 'confession';
  title: string;
  description: string;
  affinityChange: number;
  trustChange?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getNodeIcon(memory: CompanionMemory): React.ElementType {
  const desc = memory.description.toLowerCase();
  
  if (desc.includes('combat') || desc.includes('battle') || desc.includes('fight')) return Swords;
  if (desc.includes('gift') || memory.type === 'gift') return Gift;
  if (desc.includes('love') || desc.includes('romance') || desc.includes('kiss')) return Heart;
  if (desc.includes('trust') || desc.includes('confide')) return Shield;
  if (desc.includes('saved') || desc.includes('helped')) return HandHeart;
  if (memory.type === 'betrayal') return Skull;
  
  if (memory.affinityChange >= 10) return Star;
  if (memory.affinityChange > 0) return TrendingUp;
  if (memory.affinityChange <= -10) return Flame;
  if (memory.affinityChange < 0) return TrendingDown;
  
  return MessageCircle;
}

export function RelationshipTimelineHorizontal({ companion }: RelationshipTimelineHorizontalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);

  // Build timeline nodes from significant memories
  const nodes = useMemo(() => {
    const result: TimelineNode[] = [];
    
    // Add join event
    result.push({
      id: 'join',
      timestamp: companion.joinedAt,
      type: 'join',
      title: 'First Meeting',
      description: `${companion.name} joined your journey`,
      affinityChange: 0,
      icon: HandHeart,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      borderColor: 'border-primary/50',
    });
    
    // Filter significant memories (meaningful changes only)
    const significantMemories = companion.memories
      .filter(m => !m.forgotten && Math.abs(m.affinityChange) >= 3)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    significantMemories.forEach((memory, index) => {
      const isMajorPositive = memory.affinityChange >= 10;
      const isMajorNegative = memory.affinityChange <= -10;
      const isBetrayal = memory.type === 'betrayal';
      
      let nodeType: TimelineNode['type'] = memory.affinityChange > 0 ? 'positive' : 'negative';
      if (isMajorPositive) nodeType = 'major_positive';
      if (isMajorNegative) nodeType = 'major_negative';
      if (isBetrayal) nodeType = 'betrayal';
      
      // Determine colors based on change magnitude
      let color = 'text-muted-foreground';
      let bgColor = 'bg-muted/20';
      let borderColor = 'border-border/50';
      
      if (memory.affinityChange >= 10) {
        color = 'text-yellow-400';
        bgColor = 'bg-yellow-500/20';
        borderColor = 'border-yellow-500/50';
      } else if (memory.affinityChange > 0) {
        color = 'text-emerald-400';
        bgColor = 'bg-emerald-500/20';
        borderColor = 'border-emerald-500/50';
      } else if (memory.affinityChange <= -10) {
        color = 'text-red-400';
        bgColor = 'bg-red-500/20';
        borderColor = 'border-red-500/50';
      } else if (memory.affinityChange < 0) {
        color = 'text-orange-400';
        bgColor = 'bg-orange-500/20';
        borderColor = 'border-orange-500/50';
      }
      
      result.push({
        id: `memory-${index}`,
        timestamp: memory.timestamp,
        type: nodeType,
        title: memory.type === 'betrayal' ? 'Betrayal' :
               memory.type === 'gift' ? 'Gift' :
               memory.affinityChange >= 10 ? 'Major Bond' :
               memory.affinityChange <= -10 ? 'Major Conflict' :
               memory.affinityChange > 0 ? 'Positive Moment' : 'Tension',
        description: memory.description,
        affinityChange: memory.affinityChange,
        icon: getNodeIcon(memory),
        color,
        bgColor,
        borderColor,
      });
    });
    
    // Add confession if applicable
    if (companion.confessedLove) {
      result.push({
        id: 'confession',
        timestamp: companion.lastSpoke || Date.now(),
        type: 'confession',
        title: 'Romantic Confession',
        description: `${companion.name} confessed their feelings`,
        affinityChange: 0,
        icon: Heart,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
        borderColor: 'border-pink-500/50',
      });
    }
    
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [companion]);

  // Check scroll state
  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      // Scroll to end (most recent) on mount
      setTimeout(() => {
        container.scrollLeft = container.scrollWidth;
        updateScrollState();
      }, 100);
    }
    return () => container?.removeEventListener('scroll', updateScrollState);
  }, [nodes]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (nodes.length <= 1) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No significant relationship changes yet</p>
        <p className="text-xs mt-1 opacity-70">
          Your actions will shape this timeline
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Timeline Container */}
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          
          {/* Scrollable Timeline */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide pb-4 pt-2 px-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="relative min-w-max flex items-center gap-0">
              {/* Timeline Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-border to-primary/20 -translate-y-1/2" />
              
              {/* Nodes */}
              {nodes.map((node, index) => {
                const Icon = node.icon;
                const isSelected = selectedNode?.id === node.id;
                const isPositive = node.affinityChange > 0;
                const nodeSize = Math.abs(node.affinityChange) >= 10 ? 'large' : 'normal';
                
                return (
                  <div key={node.id} className="flex items-center">
                    {/* Connector Line Segment */}
                    {index > 0 && (
                      <div 
                        className={cn(
                          "h-0.5 w-12 sm:w-16",
                          node.affinityChange > 0 ? "bg-emerald-500/30" :
                          node.affinityChange < 0 ? "bg-red-500/30" :
                          "bg-border"
                        )}
                      />
                    )}
                    
                    {/* Node */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                          onClick={() => setSelectedNode(isSelected ? null : node)}
                          className={cn(
                            "relative flex flex-col items-center group transition-all",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
                          )}
                        >
                          {/* Node Circle */}
                          <div className={cn(
                            "relative rounded-full border-2 flex items-center justify-center transition-all",
                            node.bgColor,
                            node.borderColor,
                            nodeSize === 'large' ? "w-12 h-12" : "w-9 h-9",
                            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                            "group-hover:scale-110"
                          )}>
                            <Icon className={cn(
                              node.color,
                              nodeSize === 'large' ? "w-5 h-5" : "w-4 h-4"
                            )} />
                            
                            {/* Change Badge */}
                            {node.affinityChange !== 0 && (
                              <span className={cn(
                                "absolute -top-1 -right-1 text-[10px] font-bold px-1 rounded-full",
                                isPositive 
                                  ? "bg-emerald-500 text-white" 
                                  : "bg-red-500 text-white"
                              )}>
                                {isPositive ? '+' : ''}{node.affinityChange}
                              </span>
                            )}
                          </div>
                          
                          {/* Date Label (below) */}
                          <span className="mt-2 text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDate(node.timestamp)}
                          </span>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="max-w-[200px] z-[200]"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{node.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {node.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime(node.timestamp)}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Fade Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
        
        {/* Selected Node Detail */}
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl border",
              selectedNode.bgColor,
              selectedNode.borderColor
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2.5 rounded-lg",
                selectedNode.bgColor
              )}>
                <selectedNode.icon className={cn("w-5 h-5", selectedNode.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-medium">{selectedNode.title}</h4>
                  {selectedNode.affinityChange !== 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      selectedNode.affinityChange > 0 
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    )}>
                      {selectedNode.affinityChange > 0 ? '+' : ''}{selectedNode.affinityChange} Affinity
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedNode.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {new Date(selectedNode.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Timeline Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <span>Major Bond</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/50" />
            <span>Tension</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <span>Conflict</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
