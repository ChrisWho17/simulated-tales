// Portrait Frame Component with genre-specific styling

import { cn } from '@/lib/utils';
import { Loader2, User } from 'lucide-react';
import { EmotionType } from '@/game/portraitSystem';

interface PortraitFrameProps {
  portrait: string | null;
  isLoading: boolean;
  relationshipColor: 'green' | 'yellow' | 'red' | 'pink' | 'cyan';
  genre: string;
  npcName: string;
  emotion: EmotionType;
}

export function PortraitFrame({
  portrait,
  isLoading,
  relationshipColor,
  genre,
  npcName,
  emotion
}: PortraitFrameProps) {
  // Get frame style based on genre
  const getFrameStyle = () => {
    switch (genre.toLowerCase()) {
      case 'fantasy':
        return 'portrait-frame-fantasy';
      case 'scifi':
      case 'cyberpunk':
        return 'portrait-frame-scifi';
      case 'horror':
        return 'portrait-frame-horror';
      case 'mystery':
        return 'portrait-frame-noir';
      default:
        return 'portrait-frame-default';
    }
  };

  // Get glow color based on relationship
  const getGlowColor = () => {
    switch (relationshipColor) {
      case 'green': return 'rgba(16, 185, 129, 0.4)';
      case 'yellow': return 'rgba(245, 158, 11, 0.4)';
      case 'red': return 'rgba(244, 63, 94, 0.4)';
      case 'pink': return 'rgba(236, 72, 153, 0.4)';
      case 'cyan': return 'rgba(34, 211, 238, 0.4)';
      default: return 'rgba(139, 92, 246, 0.4)';
    }
  };

  // Get border gradient based on relationship
  const getBorderGradient = () => {
    switch (relationshipColor) {
      case 'green': return 'from-success/60 via-success/30 to-success/60';
      case 'yellow': return 'from-warning/60 via-warning/30 to-warning/60';
      case 'red': return 'from-destructive/60 via-destructive/30 to-destructive/60';
      case 'pink': return 'from-pink-500/60 via-pink-500/30 to-pink-500/60';
      case 'cyan': return 'from-cyan-500/60 via-cyan-500/30 to-cyan-500/60';
      default: return 'from-primary/60 via-primary/30 to-primary/60';
    }
  };

  return (
    <div className="relative">
      {/* Animated glow effect */}
      <div 
        className="absolute inset-0 rounded-xl blur-xl animate-pulse opacity-60"
        style={{ 
          background: `radial-gradient(circle, ${getGlowColor()}, transparent 70%)`,
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Gradient border container */}
      <div className={cn(
        "relative p-1 rounded-xl",
        "bg-gradient-to-br",
        getBorderGradient()
      )}>
        {/* Inner frame with genre styling */}
        <div 
          className={cn(
            "relative w-48 h-64 md:w-56 md:h-72",
            "rounded-lg overflow-hidden",
            "bg-black/50 backdrop-blur-sm",
            getFrameStyle()
          )}
        >
          {/* Portrait content */}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Generating portrait...</span>
              </div>
            </div>
          ) : portrait ? (
            <>
              <img 
                src={portrait} 
                alt={npcName}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300",
                  // Subtle animation based on emotion
                  emotion === 'scared' && "animate-[shake_0.5s_ease-in-out_infinite]",
                  emotion === 'angry' && "saturate-110 contrast-105"
                )}
              />
              {/* Breathing overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent animate-[breathe_4s_ease-in-out_infinite]" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <User className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}

          {/* Genre-specific overlays */}
          {genre.toLowerCase() === 'scifi' && (
            <>
              {/* Scan lines */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
                  }}
                />
              </div>
              {/* Holographic shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 animate-shimmer" />
            </>
          )}

          {genre.toLowerCase() === 'horror' && (
            <>
              {/* Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
              {/* Subtle distortion on hover */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-red-900/10" />
            </>
          )}

          {genre.toLowerCase() === 'mystery' && (
            <>
              {/* Noir spotlight effect */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
              {/* Shadow bars */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.4) 30px, rgba(0,0,0,0.4) 35px)'
                }}
              />
            </>
          )}

          {genre.toLowerCase() === 'fantasy' && (
            <>
              {/* Aged parchment texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-amber-900/10 mix-blend-overlay" />
              {/* Ornate corner decorations (simulated) */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-600/50 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-600/50 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-600/50 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-600/50 rounded-br" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
