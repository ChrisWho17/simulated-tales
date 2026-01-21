// Streaming Narrative Entry Component
// Displays AI narrative text word-by-word as it streams in
// Cleans mechanic tags and OOC content in real-time

import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { CoreMoodType, MOOD_COLORS } from '@/game/moodSystem';
import { cn } from '@/lib/utils';
import { stripMechanicTags } from '@/lib/narrativeFilter';

interface StreamingNarrativeEntryProps {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  currentMood: CoreMoodType;
  error?: string | null;
}

export const StreamingNarrativeEntry = memo(function StreamingNarrativeEntry({
  content,
  isStreaming,
  isComplete,
  currentMood,
  error,
}: StreamingNarrativeEntryProps) {
  // Get mood-based styling
  const moodConfig = useMemo(() => {
    const moodColor = MOOD_COLORS[currentMood];
    return {
      borderColor: moodColor?.border || 'rgba(139, 92, 246, 0.3)',
      glowColor: moodColor?.glow || 'rgba(139, 92, 246, 0.15)',
    };
  }, [currentMood]);

  // Clean content of mechanic tags in real-time as it streams
  const cleanedContent = useMemo(() => {
    if (!content) return '';
    return stripMechanicTags(content);
  }, [content]);

  // Split content into paragraphs for better readability
  const paragraphs = useMemo(() => {
    if (!cleanedContent) return [];
    return cleanedContent.split('\n\n').filter(p => p.trim());
  }, [cleanedContent]);

  if (error) {
    return (
      <Card className="p-4 md:p-6 bg-destructive/10 border-destructive/30">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    );
  }

  // Don't render if no content yet and not streaming
  if (!content && !isStreaming) {
    return null;
  }

  return (
    <Card
      className={cn(
        "p-4 md:p-6 transition-all duration-300",
        "bg-gradient-to-br from-card/80 to-card/60",
        "backdrop-blur-sm",
        isStreaming && "animate-pulse-subtle"
      )}
      style={{
        borderColor: moodConfig.borderColor,
        boxShadow: `0 0 20px ${moodConfig.glowColor}`,
      }}
    >
      <div className="font-narrative text-base md:text-lg leading-relaxed text-foreground/90">
        {paragraphs.map((paragraph, index) => (
          <p 
            key={index} 
            className={cn(
              "mb-4 last:mb-0",
              // Fade in each paragraph
              "animate-fade-in"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {paragraph}
          </p>
        ))}
        
        {/* Streaming cursor indicator */}
        {isStreaming && (
          <span className="inline-flex items-center ml-1">
            <span className="animate-pulse text-primary">▊</span>
          </span>
        )}
      </div>

      {/* Streaming indicator at bottom */}
      {isStreaming && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Weaving the narrative...
          </span>
        </div>
      )}
    </Card>
  );
});

// Hook to manage streaming narrative state for the game
export function useStreamingNarrativeDisplay() {
  const [streamingEntry, setStreamingEntry] = React.useState<{
    id: string;
    content: string;
    isStreaming: boolean;
    isComplete: boolean;
    error: string | null;
  } | null>(null);

  const startStreaming = React.useCallback((id: string) => {
    setStreamingEntry({
      id,
      content: '',
      isStreaming: true,
      isComplete: false,
      error: null,
    });
  }, []);

  const updateContent = React.useCallback((content: string) => {
    setStreamingEntry(prev => prev ? { ...prev, content } : null);
  }, []);

  const completeStreaming = React.useCallback((finalContent: string) => {
    setStreamingEntry(prev => prev ? {
      ...prev,
      content: finalContent,
      isStreaming: false,
      isComplete: true,
    } : null);
  }, []);

  const setError = React.useCallback((error: string) => {
    setStreamingEntry(prev => prev ? {
      ...prev,
      isStreaming: false,
      error,
    } : null);
  }, []);

  const clearStreaming = React.useCallback(() => {
    setStreamingEntry(null);
  }, []);

  return {
    streamingEntry,
    startStreaming,
    updateContent,
    completeStreaming,
    setError,
    clearStreaming,
  };
}
