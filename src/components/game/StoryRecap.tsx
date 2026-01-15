import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface StoryRecapProps {
  isOpen: boolean;
  onClose: () => void;
  storyEvents: Array<{
    id: string;
    content: string;
    timestamp: number;
    type: string;
  }>;
  characterName: string;
  currentLocation: string;
}

export function StoryRecap({ 
  isOpen, 
  onClose, 
  storyEvents, 
  characterName,
  currentLocation 
}: StoryRecapProps) {
  const [recap, setRecap] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecap = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Get recent significant events
      const recentEvents = storyEvents
        .slice(-20)
        .filter(e => e.type === 'dialogue' || e.type === 'observation' || e.type === 'discovery')
        .map(e => e.content.substring(0, 200))
        .join('\n---\n');

      const response = await supabase.functions.invoke('generate-adventure', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a narrator creating a "Previously on..." style recap for a story-driven game. 
Write in a dramatic, engaging style like a TV show recap narrator.
Keep it to 3-4 short paragraphs.
Focus on key plot points, character developments, and dramatic moments.
Use present tense for immediacy.`
            },
            {
              role: 'user',
              content: `Create a "Previously on..." recap for ${characterName}'s story.

Current location: ${currentLocation}

Recent events:
${recentEvents}

Write a dramatic recap that sets the stage for what comes next.`
            }
          ]
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setRecap(response.data?.response || 'Unable to generate recap.');
    } catch (err) {
      console.error('Failed to generate recap:', err);
      setError('Failed to generate recap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate a simple local recap if no AI available
  const generateSimpleRecap = () => {
    const recentEvents = storyEvents.slice(-10);
    const dialogues = recentEvents.filter(e => e.type === 'dialogue').length;
    const discoveries = recentEvents.filter(e => e.type === 'discovery').length;
    const locations = [...new Set(recentEvents.map(e => e.content.match(/\*\*(.+?)\*\*/)?.[1]).filter(Boolean))];

    const recapText = `**Previously on ${characterName}'s Adventure...**

${characterName} has been busy. ${dialogues > 0 ? `There have been ${dialogues} conversations with the locals.` : ''} 
${discoveries > 0 ? `${discoveries} discoveries have been made along the way.` : ''}
${locations.length > 0 ? `Recent travels have taken our hero through: ${locations.slice(0, 3).join(', ')}.` : ''}

Currently, ${characterName} finds themselves at **${currentLocation}**, ready for whatever comes next...`;

    setRecap(recapText);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="glass-panel w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="font-display text-lg">Story So Far</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="p-6 max-h-[70vh]">
              {!recap && !isGenerating && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-display text-lg mb-2">Previously on...</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get a dramatic recap of your adventure so far.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={generateRecap}
                      className="gap-2"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate AI Recap
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateSimpleRecap}
                      className="gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Quick Summary
                    </Button>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-[var(--accent-primary)] mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-muted-foreground italic">
                    Composing your story...
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button variant="outline" onClick={generateSimpleRecap}>
                    Use Quick Summary Instead
                  </Button>
                </div>
              )}

              {recap && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-sm italic text-muted-foreground text-center mb-4">
                    * * *
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <p className="font-narrative text-lg leading-relaxed whitespace-pre-line">
                      {recap}
                    </p>
                  </div>
                  <div className="text-sm italic text-muted-foreground text-center mt-4">
                    * * *
                  </div>
                  <div className="flex justify-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setRecap(null); setError(null); }}
                    >
                      Generate New Recap
                    </Button>
                    <Button
                      size="sm"
                      onClick={onClose}
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      Continue Adventure
                    </Button>
                  </div>
                </motion.div>
              )}
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact "Previously on" banner for session start
export function PreviouslyOnBanner({ 
  characterName, 
  lastLocation,
  onDismiss 
}: { 
  characterName: string;
  lastLocation: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
    >
      <div className="glass-panel p-4 rounded-lg border border-[var(--accent-primary)]/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Previously on...
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
            <X className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-sm">
          <span className="font-display text-[var(--accent-primary)]">{characterName}</span>
          {' '}was last seen at{' '}
          <span className="font-medium">{lastLocation}</span>
        </p>
      </div>
    </motion.div>
  );
}
