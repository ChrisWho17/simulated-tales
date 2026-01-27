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

// ============================================================================
// ANIMATED BLOOD FLOW CONNECTOR
// ============================================================================

interface BloodFlowConnectorProps {
  fromChange: number;
  toChange: number;
  width?: number;
}

function BloodFlowConnector({ fromChange, toChange, width = 64 }: BloodFlowConnectorProps) {
  // Determine colors based on affinity changes
  const getColor = (change: number) => {
    if (change >= 10) return { start: '#facc15', end: '#eab308' }; // yellow/gold
    if (change > 0) return { start: '#34d399', end: '#10b981' }; // emerald
    if (change <= -10) return { start: '#f87171', end: '#ef4444' }; // red
    if (change < 0) return { start: '#fb923c', end: '#f97316' }; // orange
    return { start: '#a78bfa', end: '#8b5cf6' }; // primary/violet
  };
  
  const fromColor = getColor(fromChange);
  const toColor = getColor(toChange);
  
  // Unique ID for gradient
  const gradientId = `blood-flow-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="relative h-8 flex items-center" style={{ width }}>
      <svg 
        width={width} 
        height="32" 
        viewBox={`0 0 ${width} 32`}
        className="overflow-visible"
      >
        <defs>
          {/* Gradient from previous node color to current */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fromColor.end} stopOpacity="0.6" />
            <stop offset="50%" stopColor={toColor.start} stopOpacity="0.8" />
            <stop offset="100%" stopColor={toColor.end} stopOpacity="0.6" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background line */}
        <line
          x1="0"
          y1="16"
          x2={width}
          y2="16"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeOpacity="0.3"
        />
        
        {/* Animated gradient line */}
        <line
          x1="0"
          y1="16"
          x2={width}
          y2="16"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          filter={`url(#glow-${gradientId})`}
          className="animate-pulse"
        />
        
        {/* Blood flow particles */}
        <circle r="2.5" fill={toColor.start} opacity="0.9" filter={`url(#glow-${gradientId})`}>
          <animate
            attributeName="cx"
            from="0"
            to={width}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="16;14;16;18;16"
            dur="0.75s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0.9;0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        
        <circle r="2" fill={fromColor.end} opacity="0.7" filter={`url(#glow-${gradientId})`}>
          <animate
            attributeName="cx"
            from="0"
            to={width}
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="cy"
            values="16;18;16;14;16"
            dur="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.7;0.7;0.7;0"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        </circle>
        
        <circle r="1.5" fill={toColor.end} opacity="0.5" filter={`url(#glow-${gradientId})`}>
          <animate
            attributeName="cx"
            from="0"
            to={width}
            dur="2.5s"
            begin="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.5;0.5;0.5;0"
            dur="2.5s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
              {/* Nodes with animated connectors */}
              {nodes.map((node, index) => {
                const Icon = node.icon;
                const isSelected = selectedNode?.id === node.id;
                const isPositive = node.affinityChange > 0;
                const nodeSize = Math.abs(node.affinityChange) >= 10 ? 'large' : 'normal';
                const prevNode = index > 0 ? nodes[index - 1] : null;
                
                return (
                  <div key={node.id} className="flex items-center">
                    {/* Animated Blood Flow Connector */}
                    {prevNode && (
                      <BloodFlowConnector
                        fromChange={prevNode.affinityChange}
                        toChange={node.affinityChange}
                        width={64}
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
                          {/* Pulse ring for major events */}
                          {(node.type === 'major_positive' || node.type === 'major_negative' || node.type === 'betrayal') && (
                            <motion.div
                              className={cn(
                                "absolute inset-0 rounded-full",
                                node.type === 'major_positive' ? "bg-yellow-500/30" :
                                node.type === 'betrayal' ? "bg-red-500/30" : "bg-red-500/30"
                              )}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{
                                width: nodeSize === 'large' ? 48 : 36,
                                height: nodeSize === 'large' ? 48 : 36,
                              }}
                            />
                          )}
                          
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
