import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SceneIllustrationProps {
  imageUrl: string | null;
  prompt?: string;
  isLoading?: boolean;
  onClose?: () => void;
  onGenerate?: () => void;
  showControls?: boolean;
}

export function SceneIllustration({ 
  imageUrl, 
  prompt,
  isLoading = false, 
  onClose,
  onGenerate,
  showControls = true 
}: SceneIllustrationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (!imageUrl && !isLoading) {
    return null;
  }

  return (
    <>
      {/* Thumbnail/inline view */}
      <div 
        className={cn(
          "scene-illustration-container relative rounded-lg overflow-hidden bg-muted/50 border border-border/50",
          "min-h-[200px] max-h-[300px]",
          isLoading && "animate-pulse"
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4 min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              Illustrating scene...
            </p>
            {prompt && (
              <p className="text-xs text-muted-foreground/70 text-center line-clamp-2 max-w-xs">
                {prompt}
              </p>
            )}
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 min-h-[200px]">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Failed to load scene</p>
            {onGenerate && (
              <Button variant="outline" size="sm" onClick={onGenerate}>
                Retry
              </Button>
            )}
          </div>
        ) : imageUrl && (
          <>
            <img 
              src={imageUrl} 
              alt="Scene illustration"
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsExpanded(true)}
              onError={() => setHasError(true)}
            />
            
            {showControls && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-black/50 hover:bg-black/70"
                  onClick={() => setIsExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4 text-white" />
                </Button>
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen expanded view */}
      {isExpanded && imageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={imageUrl} 
              alt="Scene illustration"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 h-10 w-10 bg-black/50 hover:bg-black/70"
              onClick={() => setIsExpanded(false)}
            >
              <Minimize2 className="h-5 w-5 text-white" />
            </Button>
            
            {prompt && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/70 rounded-lg">
                <p className="text-sm text-white/80 text-center">{prompt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Scene trigger types for when to generate illustrations
export type SceneTriggerType = 
  | 'location_arrival'
  | 'npc_meeting'
  | 'combat_start'
  | 'dramatic_moment'
  | 'romantic_scene'
  | 'discovery';

export interface SceneTrigger {
  type: SceneTriggerType;
  priority: number;
  description: string;
  entities: string[];
  location: string;
}

// Check if a scene should be illustrated based on event type
export function shouldIllustrateScene(
  eventType: string,
  eventContent: string,
  lastIllustrationTick: number,
  currentTick: number,
  minTicksBetween: number = 10
): SceneTrigger | null {
  // Don't illustrate too frequently
  if (currentTick - lastIllustrationTick < minTicksBetween) {
    return null;
  }

  const contentLower = eventContent.toLowerCase();

  // Location arrival
  if (eventType === 'observation' && contentLower.includes('you find yourself in')) {
    return {
      type: 'location_arrival',
      priority: 2,
      description: 'Arriving at a new location',
      entities: [],
      location: extractLocationFromContent(eventContent),
    };
  }

  // Combat start
  if (eventType === 'combat' || contentLower.includes('attacks you') || contentLower.includes('combat begins')) {
    return {
      type: 'combat_start',
      priority: 1,
      description: 'Combat encounter beginning',
      entities: extractNPCsFromContent(eventContent),
      location: '',
    };
  }

  // Dramatic moments
  const dramaticKeywords = ['death', 'dying', 'explosion', 'fire', 'scream', 'collapse', 'betray'];
  if (dramaticKeywords.some(kw => contentLower.includes(kw))) {
    return {
      type: 'dramatic_moment',
      priority: 1,
      description: 'A dramatic moment unfolds',
      entities: extractNPCsFromContent(eventContent),
      location: '',
    };
  }

  // Romantic scenes (if 18+ enabled, handled elsewhere)
  const romanticKeywords = ['kiss', 'embrace', 'confess', 'love', 'intimate'];
  if (romanticKeywords.some(kw => contentLower.includes(kw))) {
    return {
      type: 'romantic_scene',
      priority: 2,
      description: 'A romantic moment',
      entities: extractNPCsFromContent(eventContent),
      location: '',
    };
  }

  // NPC first meeting
  if (eventType === 'dialogue' && (contentLower.includes('first time') || contentLower.includes('introduces'))) {
    return {
      type: 'npc_meeting',
      priority: 3,
      description: 'Meeting someone new',
      entities: extractNPCsFromContent(eventContent),
      location: '',
    };
  }

  return null;
}

function extractLocationFromContent(content: string): string {
  const match = content.match(/\*\*([^*]+)\*\*/);
  return match ? match[1] : '';
}

function extractNPCsFromContent(content: string): string[] {
  // Simple extraction - could be enhanced
  const matches = content.match(/\*\*([A-Z][a-z]+)\*\*/g);
  return matches ? matches.map(m => m.replace(/\*/g, '')) : [];
}
