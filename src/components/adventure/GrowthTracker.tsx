import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, Star, Heart, Skull, Zap, Users, 
  BookOpen, ChevronDown, ChevronRight, Sparkles,
  Target, Clock, Award, AlertTriangle
} from 'lucide-react';
import {
  CharacterMilestone,
  CharacterArc,
  GrowthTracking,
  PersonalGrowthEntry,
  ARC_TEMPLATES,
} from '@/game/characterDevelopmentSystem';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface GrowthTrackerProps {
  characterName: string;
  growthData: GrowthTracking;
  currentTurn: number;
  onJumpToTurn?: (turn: number) => void;
  onAddArc?: (arc: CharacterArc) => void;
  onUpdateArc?: (arcId: string, progress: number) => void;
}

const MILESTONE_ICONS: Record<CharacterMilestone['type'], React.ReactNode> = {
  level_up: <Star className="w-4 h-4 text-amber-400" />,
  first_kill: <Skull className="w-4 h-4 text-destructive" />,
  first_love: <Heart className="w-4 h-4 text-pink-400" />,
  major_choice: <Target className="w-4 h-4 text-primary" />,
  near_death: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  betrayal: <Zap className="w-4 h-4 text-destructive" />,
  redemption: <Sparkles className="w-4 h-4 text-emerald-400" />,
  discovery: <BookOpen className="w-4 h-4 text-blue-400" />,
  loss: <Heart className="w-4 h-4 text-muted-foreground" />,
  triumph: <Award className="w-4 h-4 text-amber-400" />,
};

const EMOTION_COLORS: Record<CharacterMilestone['emotionalImpact'], string> = {
  joyful: 'border-emerald-500/50 bg-emerald-500/10',
  painful: 'border-destructive/50 bg-destructive/10',
  transformative: 'border-primary/50 bg-primary/10',
  bittersweet: 'border-amber-500/50 bg-amber-500/10',
};

export function GrowthTracker({
  characterName,
  growthData,
  currentTurn,
  onJumpToTurn,
  onAddArc,
  onUpdateArc,
}: GrowthTrackerProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'arcs' | 'growth'>('timeline');
  const [expandedArcs, setExpandedArcs] = useState<Set<string>>(new Set());
  const [showArcPicker, setShowArcPicker] = useState(false);

  const sortedMilestones = useMemo(() => {
    return [...growthData.milestones].sort((a, b) => b.turnAchieved - a.turnAchieved);
  }, [growthData.milestones]);

  const toggleArcExpanded = (arcId: string) => {
    setExpandedArcs(prev => {
      const next = new Set(prev);
      if (next.has(arcId)) next.delete(arcId);
      else next.add(arcId);
      return next;
    });
  };

  const handleAddArc = (template: typeof ARC_TEMPLATES[number]) => {
    if (!onAddArc) return;
    
    const newArc: CharacterArc = {
      id: `arc_${Date.now()}`,
      name: template.name,
      description: template.description,
      startingState: template.startingState,
      currentState: template.currentState,
      desiredEndState: template.desiredEndState,
      progress: 0,
      keyMoments: [],
      isComplete: false,
    };
    
    onAddArc(newArc);
    setShowArcPicker(false);
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <h2 className="font-semibold">{characterName}'s Journey</h2>
            <p className="text-xs text-muted-foreground">
              Turn {currentTurn} • {sortedMilestones.length} milestones
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {[
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'arcs', label: 'Character Arcs', icon: TrendingUp },
          { id: 'growth', label: 'Growth Log', icon: Sparkles },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {sortedMilestones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No milestones yet</p>
                <p className="text-xs mt-1">Your story is just beginning...</p>
              </div>
            ) : (
              sortedMilestones.map((milestone) => (
                <button
                  key={milestone.id}
                  onClick={() => onJumpToTurn?.(milestone.turnAchieved)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.01]",
                    EMOTION_COLORS[milestone.emotionalImpact]
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {MILESTONE_ICONS[milestone.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {milestone.title}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          Turn {milestone.turnAchieved}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {milestone.description}
                      </p>
                      {milestone.relatedNPCs && milestone.relatedNPCs.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {milestone.relatedNPCs.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'arcs' && (
          <div className="space-y-3">
            {growthData.arcs.map((arc) => (
              <Collapsible
                key={arc.id}
                open={expandedArcs.has(arc.id)}
                onOpenChange={() => toggleArcExpanded(arc.id)}
              >
                <div className={cn(
                  "rounded-lg border transition-all",
                  arc.isComplete 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : "border-border/50 bg-background/50"
                )}>
                  <CollapsibleTrigger className="w-full p-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedArcs.has(arc.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{arc.name}</span>
                        {arc.isComplete && (
                          <Award className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${arc.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {arc.progress}%
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/30 mt-2">
                      <p className="text-xs text-muted-foreground">{arc.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/30">
                          <div className="text-muted-foreground mb-0.5">Started as</div>
                          <div>{arc.startingState}</div>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <div className="text-muted-foreground mb-0.5">Currently</div>
                          <div>{arc.currentState}</div>
                        </div>
                      </div>
                      
                      {arc.desiredEndState && (
                        <div className="p-2 rounded bg-emerald-500/10 text-xs">
                          <div className="text-muted-foreground mb-0.5">Working toward</div>
                          <div>{arc.desiredEndState}</div>
                        </div>
                      )}

                      {arc.keyMoments.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-1">Key Moments:</div>
                          <div className="space-y-1">
                            {arc.keyMoments.map((moment, i) => (
                              <div key={i} className="text-xs flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {moment}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {onUpdateArc && !arc.isComplete && (
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateArc(arc.id, Math.min(100, arc.progress + 10))}
                            className="flex-1 text-xs h-7"
                          >
                            +10% Progress
                          </Button>
                          {arc.progress >= 100 && (
                            <Button
                              size="sm"
                              onClick={() => onUpdateArc(arc.id, 100)}
                              className="flex-1 text-xs h-7"
                            >
                              Complete Arc
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {onAddArc && (
              <>
                {showArcPicker ? (
                  <div className="space-y-2 p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                    <div className="text-sm font-medium mb-2">Choose an Arc Template:</div>
                    {ARC_TEMPLATES.map((template, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddArc(template)}
                        className="w-full text-left p-2 rounded hover:bg-primary/10 transition-colors"
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowArcPicker(false)}
                      className="w-full mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowArcPicker(true)}
                    className="w-full border-dashed"
                  >
                    + Add Character Arc
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-3">
            {growthData.personalGrowthLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No growth recorded yet</p>
                <p className="text-xs mt-1">Changes will appear as your character evolves</p>
              </div>
            ) : (
              growthData.personalGrowthLog.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-3 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      entry.category === 'belief' ? 'bg-purple-500/20 text-purple-400' :
                      entry.category === 'relationship' ? 'bg-pink-500/20 text-pink-400' :
                      entry.category === 'skill' ? 'bg-blue-500/20 text-blue-400' :
                      entry.category === 'personality' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {entry.category}
                    </span>
                    <span className="text-xs text-muted-foreground">Turn {entry.turn}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through">{entry.before}</span>
                    <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{entry.after}</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Triggered by: {entry.trigger}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GrowthTracker;
