import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ParticleBackground, AmbientGlow } from './particle-background';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
  onLoadComplete?: () => void;
  minDuration?: number;
}

export function LoadingScreen({ 
  isLoading, 
  message = 'Preparing your adventure...', 
  onLoadComplete,
  minDuration = 500 
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFadeOut(false);
    } else {
      // Minimum duration before allowing fade out
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onLoadComplete?.();
        }, 500); // Fade out duration
      }, minDuration);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDuration, onLoadComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Atmospheric effects */}
      <ParticleBackground particleCount={30} speed={0.2} />
      <AmbientGlow />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient-primary tracking-wider mb-2">
            UNTOLD
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.4em]">
            Living World Engine
          </p>
        </div>

        {/* Loading spinner with glow */}
        <div className="relative">
          <div className="absolute inset-0 animate-glow-pulse rounded-full" />
          <div className="relative p-6 rounded-full glass-panel border-[rgba(139,92,246,0.3)]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        {/* Loading message */}
        <p className="text-muted-foreground font-narrative text-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {message}
        </p>

        {/* Loading bar */}
        <div className="w-64 h-1 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] rounded-full animate-shimmer"
            style={{ 
              width: '100%',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}

// Simple inline loader for smaller components
export function InlineLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="font-narrative italic">{message}</span>
    </div>
  );
}

// Skeleton loader with shimmer
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-muted/50 rounded-lg animate-pulse relative overflow-hidden ${className}`}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        style={{
          animation: 'shimmer 2s infinite',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}