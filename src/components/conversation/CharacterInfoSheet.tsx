// Character Info Sheet - shows when NPC portrait is tapped

import { useState } from 'react';
import { NPC, Relationship } from '@/types/game';
import { EmotionType } from '@/game/portraitSystem';
import { cn } from '@/lib/utils';
import { 
  Heart, Shield, AlertTriangle, Star, 
  User, Briefcase, Brain, Activity,
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatBar } from '@/components/ui/stat-bar';

interface CharacterInfoSheetProps {
  npc: NPC;
  portrait: string | null;
  relationship: Relationship;
  emotion: EmotionType;
  onClose: () => void;
  relationshipColor: 'green' | 'yellow' | 'red' | 'pink' | 'cyan';
}

export function CharacterInfoSheet({
  npc,
  portrait,
  relationship,
  emotion,
  onClose,
  relationshipColor
}: CharacterInfoSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRelationshipLabel = () => {
    const score = relationship.affection + relationship.trust - relationship.fear;
    if (score > 80) return 'Close Friend';
    if (score > 50) return 'Friendly';
    if (score > 20) return 'Acquaintance';
    if (score > -20) return 'Neutral';
    if (score > -50) return 'Unfriendly';
    return 'Hostile';
  };

  const getRelationshipIcon = () => {
    switch (relationshipColor) {
      case 'green': return <Heart className="w-4 h-4 text-success" />;
      case 'pink': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case 'red': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'cyan': return <Star className="w-4 h-4 text-cyan-500" />;
      default: return <User className="w-4 h-4 text-warning" />;
    }
  };

  const getBorderColor = () => {
    switch (relationshipColor) {
      case 'green': return 'border-success/50';
      case 'yellow': return 'border-warning/50';
      case 'red': return 'border-destructive/50';
      case 'pink': return 'border-pink-500/50';
      case 'cyan': return 'border-cyan-500/50';
      default: return 'border-primary/50';
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center",
        "bg-black/90 backdrop-blur-md animate-fade-in"
      )}
      onClick={onClose}
    >
      <div 
        className={cn(
          "w-full max-w-md mx-4",
          "glass-panel border-2",
          getBorderColor(),
          "rounded-2xl overflow-hidden",
          "animate-scale-in"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with portrait */}
        <div className="relative">
          {portrait ? (
            <div className="relative h-64 overflow-hidden">
              <img 
                src={portrait} 
                alt={npc.meta.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <User className="w-20 h-20 text-primary/50" />
            </div>
          )}
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-2xl font-display font-bold text-foreground drop-shadow-lg">
              {npc.meta.name}
            </h2>
            <p className="text-sm text-foreground/80 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {npc.meta.occupation}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Relationship Status */}
          <div className={cn(
            "glass-panel-subtle p-4 rounded-xl",
            "border",
            getBorderColor()
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getRelationshipIcon()}
                <span className="font-semibold text-foreground">{getRelationshipLabel()}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {emotion}
              </span>
            </div>

            {/* Relationship bars */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Affection
                  </span>
                  <span className="text-foreground">{relationship.affection}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, relationship.affection))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Trust
                  </span>
                  <span className="text-foreground">{relationship.trust}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, relationship.trust))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Fear
                  </span>
                  <span className="text-foreground">{relationship.fear}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, relationship.fear))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3" /> Respect
                  </span>
                  <span className="text-foreground">{relationship.respect}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, relationship.respect))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 glass-panel-subtle rounded-xl hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm text-muted-foreground">Character Details</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-3 animate-fade-in">
              {/* Stats */}
              <div className="glass-panel-subtle p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Current State
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Emotion:</span>
                    <span className="ml-2 text-foreground capitalize">{npc.emotionalState.current}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stress:</span>
                    <span className="ml-2 text-foreground">{npc.stressLevel}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <span className="ml-2 text-foreground">{npc.meta.age}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="ml-2 text-foreground">{npc.currentLocation}</span>
                  </div>
                </div>
              </div>

              {/* Traits */}
              <div className="glass-panel-subtle p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Known Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {npc.meta.traits.map((trait, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 capitalize"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="glass-panel-subtle p-4 rounded-xl">
                <p className="text-sm text-muted-foreground italic">
                  "{npc.meta.description}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}