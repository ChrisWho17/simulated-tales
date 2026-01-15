import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SessionRecapSplashProps {
  isOpen: boolean;
  onClose: () => void;
  storyEntries: Array<{
    id: string;
    content: string;
    role: 'user' | 'narrator';
    timestamp: number;
  }>;
  characterName: string;
  currentLocation?: string;
  genre?: string;
}

export function SessionRecapSplash({
  isOpen,
  onClose,
  storyEntries,
  characterName,
  currentLocation = 'unknown location',
  genre = 'fantasy',
}: SessionRecapSplashProps) {
  const [recap, setRecap] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate recap when opened
  useEffect(() => {
    if (isOpen && !recap && !isGenerating) {
      generateRecap();
    }
  }, [isOpen]);

  const generateRecap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Get recent significant story events (narrator entries only for context)
      const narratorEntries = storyEntries
        .filter(e => e.role === 'narrator')
        .slice(-15)
        .map(e => e.content.substring(0, 300))
        .join('\n---\n');

      const playerActions = storyEntries
        .filter(e => e.role === 'user')
        .slice(-10)
        .map(e => e.content.substring(0, 100))
        .join('\n');

      const response = await supabase.functions.invoke('generate-adventure', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a dramatic narrator creating a "Previously On..." style recap for a ${genre} story-driven game.
              
Write in a compelling, cinematic style like a TV show narrator doing a recap.
Keep it to 2-3 short paragraphs (under 150 words total).
Focus on:
- The most dramatic or important moments
- Key character developments
- Where the story left off
- Create tension and excitement for what's next

Use present tense for immediacy. Be evocative but concise.
Do NOT use bullet points. Write flowing narrative prose.`
            },
            {
              role: 'user',
              content: `Create a "Previously On..." recap for ${characterName}'s adventure.

Genre: ${genre}
Current location: ${currentLocation}

Recent story events:
${narratorEntries}

Player's recent actions:
${playerActions}

Write a dramatic, engaging recap that reminds the player where they are and builds excitement for continuing.`
            }
          ]
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setRecap(response.data?.response || generateFallbackRecap());
    } catch (err) {
      console.error('Failed to generate session recap:', err);
      setRecap(generateFallbackRecap());
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackRecap = () => {
    const recentNarrator = storyEntries
      .filter(e => e.role === 'narrator')
      .slice(-3);
    
    if (recentNarrator.length === 0) {
      return `${characterName} stands ready at ${currentLocation}, the adventure awaiting...`;
    }

    // Extract a brief summary from recent entries
    const lastEvent = recentNarrator[recentNarrator.length - 1]?.content || '';
    const truncated = lastEvent.length > 200 
      ? lastEvent.substring(0, 200) + '...' 
      : lastEvent;

    return `When we last saw ${characterName} at ${currentLocation}...\n\n${truncated}\n\nAnd now, the adventure continues...`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          onClick={onClose}
        >
          {/* Cinematic letterbox bars */}
          <motion.div
            initial={{ height: '15%' }}
            animate={{ height: '12%' }}
            className="absolute top-0 left-0 right-0 bg-black z-10"
          />
          <motion.div
            initial={{ height: '15%' }}
            animate={{ height: '12%' }}
            className="absolute bottom-0 left-0 right-0 bg-black z-10"
          />

          {/* Background ambient glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="absolute inset-0 bg-gradient-radial from-[var(--accent-primary)]/20 via-transparent to-transparent"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative z-20 w-full max-w-2xl px-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Previously On header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--accent-primary)]/50" />
                <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--accent-primary)]/50" />
              </div>
              <h1 className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">
                Previously On
              </h1>
              <h2 className="text-2xl font-display text-[var(--accent-primary)] mt-1">
                {characterName}'s Adventure
              </h2>
            </motion.div>

            {/* Loading state */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12"
              >
                <Loader2 className="w-8 h-8 text-[var(--accent-primary)] mx-auto animate-spin mb-4" />
                <p className="text-sm text-muted-foreground italic">
                  Recalling your journey...
                </p>
              </motion.div>
            )}

            {/* Recap content */}
            {recap && !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <div className="prose prose-sm prose-invert max-w-none mb-8">
                  <p className="font-narrative text-lg leading-relaxed text-foreground/90 whitespace-pre-line italic">
                    {recap}
                  </p>
                </div>

                {/* Decorative divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/50 to-transparent mx-auto mb-6"
                />

                {/* Continue button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  <Button
                    onClick={onClose}
                    size="lg"
                    className="gap-2 px-8"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Continue Adventure
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Click anywhere or press any key to continue
                  </p>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
