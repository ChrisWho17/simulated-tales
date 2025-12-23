// Dialogue Bubble Component with typewriter effect

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DialogueEntry } from './ConversationUI';

interface DialogueBubbleProps {
  entry: DialogueEntry;
  npcName: string;
  typewriterEffect: boolean;
  accentColor: 'green' | 'yellow' | 'red' | 'pink' | 'cyan';
}

export function DialogueBubble({
  entry,
  npcName,
  typewriterEffect,
  accentColor
}: DialogueBubbleProps) {
  const [displayedText, setDisplayedText] = useState(typewriterEffect ? '' : entry.content);
  const [isTyping, setIsTyping] = useState(typewriterEffect);

  useEffect(() => {
    if (!typewriterEffect) {
      setDisplayedText(entry.content);
      setIsTyping(false);
      return;
    }

    let index = 0;
    const text = entry.content;
    
    const typeInterval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 25);

    return () => clearInterval(typeInterval);
  }, [entry.content, typewriterEffect]);

  const getAccentClasses = () => {
    switch (accentColor) {
      case 'green': return 'border-success/40 bg-success/5';
      case 'yellow': return 'border-warning/40 bg-warning/5';
      case 'red': return 'border-destructive/40 bg-destructive/5';
      case 'pink': return 'border-pink-500/40 bg-pink-500/5';
      case 'cyan': return 'border-cyan-500/40 bg-cyan-500/5';
      default: return 'border-primary/40 bg-primary/5';
    }
  };

  const getAccentTextClasses = () => {
    switch (accentColor) {
      case 'green': return 'text-success';
      case 'yellow': return 'text-warning';
      case 'red': return 'text-destructive';
      case 'pink': return 'text-pink-500';
      case 'cyan': return 'text-cyan-500';
      default: return 'text-primary';
    }
  };

  const isNPC = entry.speaker === 'npc';

  return (
    <div 
      className={cn(
        "animate-fade-in-up",
        !isNPC && "ml-auto max-w-[85%]"
      )}
    >
      {isNPC ? (
        // NPC dialogue
        <div className={cn(
          "glass-panel-subtle rounded-xl p-4",
          "border-l-4",
          getAccentClasses()
        )}>
          <div className={cn(
            "text-xs font-semibold mb-2 uppercase tracking-wider",
            getAccentTextClasses()
          )}>
            {npcName}
          </div>
          <p className="text-foreground leading-relaxed font-narrative">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-blink" />
            )}
          </p>
        </div>
      ) : (
        // Player dialogue
        <div className="glass-panel border-primary/30 rounded-xl px-4 py-3">
          <div className="text-xs text-primary/70 mb-1 uppercase tracking-wider">
            You
          </div>
          <p className="text-foreground font-narrative">
            {entry.content}
          </p>
        </div>
      )}
    </div>
  );
}
