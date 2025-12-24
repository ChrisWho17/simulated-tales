import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, Image } from 'lucide-react';
import { ParticleBackground, AmbientGlow } from './particle-background';
import { supabase } from '@/integrations/supabase/client';
import { setCachedPortrait, EMOTION_DESCRIPTORS, EmotionType } from '@/game/portraitSystem';
import { Progress } from './progress';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
  onLoadComplete?: () => void;
  minDuration?: number;
}

interface EmotionLoadingScreenProps {
  isLoading: boolean;
  characterName: string;
  characterId: string;
  basePortraitUrl: string;
  characterClass?: string;
  clothingStyle?: string;
  portraitHints?: string[];
  onLoadComplete?: () => void;
}

const EMOTIONS_TO_GENERATE: EmotionType[] = [
  'happy', 'angry', 'sad', 'fearful', 'surprised', 'flirty', 'suspicious'
];

export function EmotionLoadingScreen({
  isLoading,
  characterName,
  characterId,
  basePortraitUrl,
  characterClass = 'Adventurer',
  clothingStyle,
  portraitHints = [],
  onLoadComplete,
}: EmotionLoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [completedEmotions, setCompletedEmotions] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateEmotionPortrait = useCallback(async (emotion: EmotionType): Promise<boolean> => {
    const emotionDesc = EMOTION_DESCRIPTORS[emotion] || 'neutral expression';
    
    try {
      const response = await supabase.functions.invoke('generate-portrait', {
        body: {
          appearance: `Character portrait for ${characterName}, a ${characterClass}. ${emotionDesc}`,
          characterClass,
          genre: 'fantasy',
          name: characterName,
          detailLevel: 'detailed',
          portraitHints,
          clothingStyle,
          referenceImageUrl: basePortraitUrl,
          emotionVariant: emotionDesc,
        }
      });

      if (response.error) {
        console.error(`Failed to generate ${emotion}:`, response.error);
        return false;
      }

      const url = response.data?.imageUrl;
      if (url) {
        setCachedPortrait(characterId, emotion, url);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error generating ${emotion}:`, error);
      return false;
    }
  }, [characterName, characterId, basePortraitUrl, characterClass, clothingStyle, portraitHints]);

  const generateAllEmotions = useCallback(async () => {
    if (isGenerating || !basePortraitUrl) return;
    
    setIsGenerating(true);
    
    // Cache the base portrait as neutral first
    setCachedPortrait(characterId, 'neutral', basePortraitUrl);
    setCompletedEmotions(['neutral']);
    setProgress(Math.round((1 / (EMOTIONS_TO_GENERATE.length + 1)) * 100));

    for (let i = 0; i < EMOTIONS_TO_GENERATE.length; i++) {
      const emotion = EMOTIONS_TO_GENERATE[i];
      setCurrentEmotion(emotion);
      
      const success = await generateEmotionPortrait(emotion);
      
      if (success) {
        setCompletedEmotions(prev => [...prev, emotion]);
      }
      
      setProgress(Math.round(((i + 2) / (EMOTIONS_TO_GENERATE.length + 1)) * 100));
      
      // Small delay between generations to avoid rate limits
      if (i < EMOTIONS_TO_GENERATE.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setCurrentEmotion('');
    setIsGenerating(false);
  }, [basePortraitUrl, characterId, generateEmotionPortrait, isGenerating]);

  useEffect(() => {
    if (isLoading && basePortraitUrl && !isGenerating && completedEmotions.length === 0) {
      generateAllEmotions();
    }
  }, [isLoading, basePortraitUrl, generateAllEmotions, isGenerating, completedEmotions.length]);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFadeOut(false);
    } else if (!isGenerating && progress >= 100) {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onLoadComplete?.();
      }, 500);
    }
  }, [isLoading, isGenerating, progress, onLoadComplete]);

  // Auto-complete when all emotions are done
  useEffect(() => {
    if (!isGenerating && completedEmotions.length >= EMOTIONS_TO_GENERATE.length + 1 && !fadeOut) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onLoadComplete?.();
        }, 500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, completedEmotions.length, fadeOut, onLoadComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <ParticleBackground particleCount={30} speed={0.2} />
      <AmbientGlow />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md px-4">
        {/* Logo */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient-primary tracking-wider mb-2">
            {characterName}
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.3em]">
            Preparing Character Expressions
          </p>
        </div>

        {/* Base Portrait Preview */}
        {basePortraitUrl && (
          <div className="w-32 h-32 rounded-full border-2 border-primary/50 overflow-hidden shadow-lg animate-fade-in">
            <img 
              src={basePortraitUrl} 
              alt={characterName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Progress */}
        <div className="w-full space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {currentEmotion ? (
              <>Generating <span className="text-primary capitalize">{currentEmotion}</span> expression...</>
            ) : progress >= 100 ? (
              'All expressions ready!'
            ) : (
              'Initializing...'
            )}
          </p>
        </div>

        {/* Emotion Grid */}
        <div className="grid grid-cols-4 gap-2">
          {['neutral', ...EMOTIONS_TO_GENERATE].map((emotion) => {
            const isComplete = completedEmotions.includes(emotion);
            const isCurrent = currentEmotion === emotion;
            
            return (
              <div 
                key={emotion}
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-xs
                  transition-all duration-300 border
                  ${isComplete 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : isCurrent 
                      ? 'bg-secondary/50 border-secondary animate-pulse'
                      : 'bg-muted/20 border-border/30 text-muted-foreground/50'
                  }
                `}
                title={emotion}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <p className="text-muted-foreground/70 text-xs text-center font-narrative italic">
          {completedEmotions.length} of {EMOTIONS_TO_GENERATE.length + 1} expressions generated
        </p>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}

export function LoadingScreen({ 
  isLoading, 
  message = 'Preparing your adventure...', 
  onLoadComplete,
  minDuration = 2000 
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFadeOut(false);
    } else {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onLoadComplete?.();
        }, 500);
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
      <ParticleBackground particleCount={30} speed={0.2} />
      <AmbientGlow />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient-primary tracking-wider mb-2">
            UNTOLD
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.4em]">
            Living World Engine
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 animate-glow-pulse rounded-full" />
          <div className="relative p-6 rounded-full glass-panel border-[rgba(139,92,246,0.3)]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        <p className="text-muted-foreground font-narrative text-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {message}
        </p>

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

      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}

export function InlineLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="font-narrative italic">{message}</span>
    </div>
  );
}

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