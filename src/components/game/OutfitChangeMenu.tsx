// Menu for changing player outfit during gameplay

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shirt, Sparkles, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CLOTHING_STYLE_OPTIONS, 
  CLOTHING_DETAIL_OPTIONS 
} from '@/types/characterCreation';
import { 
  evaluateClothingConflict, 
  GENRE_CLOTHING_EXPECTATIONS,
  ClothingContext,
  ClothingReaction,
  setPlayerClothingContext
} from '@/game/clothingReactionSystem';
import { storyAIIntegration } from '@/game/storyAIIntegration';
import { GameGenre } from '@/types/genreData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface OutfitChangeMenuProps {
  genre: GameGenre;
  currentClothing?: ClothingContext;
  onOutfitChange?: (newClothing: ClothingContext) => void;
  triggerClassName?: string;
  compact?: boolean;
}

export function OutfitChangeMenu({
  genre,
  currentClothing,
  onOutfitChange,
  triggerClassName,
  compact = false
}: OutfitChangeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(currentClothing?.clothingStyle || 'genre_default');
  const [selectedDetails, setSelectedDetails] = useState<string[]>(currentClothing?.clothingDetails || []);
  const [showDetails, setShowDetails] = useState(false);
  const [previewReaction, setPreviewReaction] = useState<ClothingReaction | null>(null);

  // Update preview when selections change
  useEffect(() => {
    const clothing: ClothingContext = {
      ...currentClothing,
      clothingStyle: selectedStyle,
      clothingDetails: selectedDetails
    };
    const reaction = evaluateClothingConflict(clothing, genre);
    setPreviewReaction(reaction);
  }, [selectedStyle, selectedDetails, genre, currentClothing]);

  // Reset to current when dialog opens
  useEffect(() => {
    if (isOpen && currentClothing) {
      setSelectedStyle(currentClothing.clothingStyle || 'genre_default');
      setSelectedDetails(currentClothing.clothingDetails || []);
    }
  }, [isOpen, currentClothing]);

  const handleDetailToggle = (detail: string) => {
    setSelectedDetails(prev => 
      prev.includes(detail) 
        ? prev.filter(d => d !== detail)
        : [...prev, detail]
    );
  };

  const handleApply = () => {
    const newClothing: ClothingContext = {
      ...currentClothing,
      clothingStyle: selectedStyle,
      clothingDetails: selectedDetails
    };
    
    // Update global state
    setPlayerClothingContext(newClothing, genre);
    storyAIIntegration.setPlayerClothing(newClothing, genre);
    
    // Callback
    onOutfitChange?.(newClothing);
    const styleLabel = CLOTHING_STYLE_OPTIONS.find(o => o.value === selectedStyle)?.label || selectedStyle;
    toast.success(`Changed to ${styleLabel} style`, {
      description: previewReaction?.isPositive 
        ? 'NPCs will react favorably!' 
        : previewReaction?.severity !== 'none'
          ? 'Note: This may draw some attention'
          : undefined
    });
    
    setIsOpen(false);
  };

  const genreExpectations = GENRE_CLOTHING_EXPECTATIONS[genre.toLowerCase()] || 
                            GENRE_CLOTHING_EXPECTATIONS['slice_of_life'];

  const getStyleStatus = (style: string) => {
    if (genreExpectations.appropriate.includes(style)) return 'appropriate';
    if (genreExpectations.tolerated.includes(style)) return 'tolerated';
    if (genreExpectations.shocking.includes(style)) return 'shocking';
    return 'neutral';
  };

  const getReactionPreviewConfig = () => {
    if (!previewReaction) return null;
    
    switch (previewReaction.severity) {
      case 'positive':
        return {
          icon: Sparkles,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          label: 'Impressive',
          description: 'NPCs will react positively to your appearance'
        };
      case 'none':
        return {
          icon: Check,
          color: 'text-muted-foreground',
          bg: 'bg-muted/50',
          border: 'border-muted',
          label: 'Neutral',
          description: 'Your appearance fits in well'
        };
      case 'mild':
        return {
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          label: 'Noticeable',
          description: 'Some NPCs may give you curious looks'
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          label: 'Uncomfortable',
          description: 'Many NPCs will react negatively'
        };
      case 'severe':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          label: 'Shocking',
          description: 'Most NPCs will have strong reactions'
        };
    }
  };

  const reactionConfig = getReactionPreviewConfig();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "default"}
          className={cn("gap-2", triggerClassName)}
        >
          <Shirt className="w-4 h-4" />
          {!compact && "Change Outfit"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            Change Outfit
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Genre info */}
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <strong className="text-foreground">{genre}</strong> setting expects: {genreExpectations.defaultAppropriate.slice(0, 3).join(', ')}
            </div>
            
            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Clothing Style</label>
              <div className="grid grid-cols-2 gap-2">
                {CLOTHING_STYLE_OPTIONS.map(option => {
                  const status = getStyleStatus(option.value);
                  const isSelected = selectedStyle === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStyle(option.value)}
                      className={cn(
                        "text-left p-2 rounded-lg border transition-all text-sm",
                        isSelected 
                          ? "border-primary bg-primary/10 ring-1 ring-primary/50" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50",
                        status === 'appropriate' && !isSelected && "border-success/30",
                        status === 'shocking' && !isSelected && "border-destructive/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {status === 'appropriate' && (
                          <Sparkles className="w-3 h-3 text-success" />
                        )}
                        {status === 'shocking' && (
                          <AlertTriangle className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Section (Collapsible) */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full justify-between py-2">
                <span>Clothing Details</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  showDetails && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {CLOTHING_DETAIL_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all text-sm",
                        selectedDetails.includes(option.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <Checkbox
                        checked={selectedDetails.includes(option.value)}
                        onCheckedChange={() => handleDetailToggle(option.value)}
                      />
                      <span className="line-clamp-1">{option.label}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Reaction Preview */}
            {reactionConfig && (
              <div className={cn(
                "rounded-lg border p-3 space-y-2",
                reactionConfig.bg,
                reactionConfig.border
              )}>
                <div className="flex items-center gap-2">
                  <reactionConfig.icon className={cn("w-4 h-4", reactionConfig.color)} />
                  <span className={cn("font-medium text-sm", reactionConfig.color)}>
                    NPC Reaction: {reactionConfig.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {reactionConfig.description}
                </p>
                {previewReaction && previewReaction.trustModifier !== 0 && (
                  <div className="flex gap-2 text-xs">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      previewReaction.trustModifier > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      Trust {previewReaction.trustModifier > 0 ? '+' : ''}{previewReaction.trustModifier}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      previewReaction.respectModifier > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      Respect {previewReaction.respectModifier > 0 ? '+' : ''}{previewReaction.respectModifier}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
