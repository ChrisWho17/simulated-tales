import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, Skull, AlertTriangle, MessageCircle } from 'lucide-react';
import { CompanionState, CompanionMood } from '@/game/companionSystem';
import { cn } from '@/lib/utils';

interface CompanionCommentaryProps {
  companion: CompanionState;
  comment: string;
  showMoodIndicator?: boolean;
  variant?: 'inline' | 'bubble' | 'minimal';
  onDismiss?: () => void;
}

const moodColors: Record<CompanionMood, string> = {
  joyful: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  content: 'text-green-400 border-green-400/30 bg-green-400/10',
  neutral: 'text-muted-foreground border-border/30 bg-muted/10',
  annoyed: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  angry: 'text-red-400 border-red-400/30 bg-red-400/10',
  sad: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  fearful: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  disgusted: 'text-amber-600 border-amber-600/30 bg-amber-600/10',
  romantic: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  betrayed: 'text-red-600 border-red-600/30 bg-red-600/10',
};

const moodEmojis: Record<CompanionMood, string> = {
  joyful: '😊',
  content: '🙂',
  neutral: '😐',
  annoyed: '😤',
  angry: '😠',
  sad: '😢',
  fearful: '😰',
  disgusted: '😒',
  romantic: '💕',
  betrayed: '💔',
};

const getMoodIcon = (mood: CompanionMood) => {
  switch (mood) {
    case 'romantic':
      return <Heart className="w-3 h-3" />;
    case 'betrayed':
    case 'angry':
      return <Skull className="w-3 h-3" />;
    case 'fearful':
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return <MessageCircle className="w-3 h-3" />;
  }
};

export function CompanionCommentary({
  companion,
  comment,
  showMoodIndicator = true,
  variant = 'inline',
  onDismiss,
}: CompanionCommentaryProps) {
  const moodStyle = moodColors[companion.mood] || moodColors.neutral;
  
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="text-sm text-muted-foreground italic"
      >
        <span className="font-medium text-foreground">{companion.name}:</span> "{comment}"
      </motion.div>
    );
  }

  if (variant === 'bubble') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        className={cn(
          "relative p-3 rounded-lg border backdrop-blur-sm max-w-md",
          moodStyle
        )}
        onClick={onDismiss}
      >
        {/* Speech bubble tail */}
        <div 
          className={cn(
            "absolute -left-2 top-4 w-0 h-0",
            "border-t-8 border-t-transparent",
            "border-r-8 border-r-current",
            "border-b-8 border-b-transparent"
          )}
          style={{ color: 'inherit', opacity: 0.3 }}
        />
        
        <div className="flex items-start gap-2">
          {/* Companion avatar/icon */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            "bg-background/50 border border-current/30"
          )}>
            {companion.name.charAt(0)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{companion.name}</span>
              {showMoodIndicator && (
                <span className="flex items-center gap-1 text-xs opacity-70">
                  {getMoodIcon(companion.mood)}
                  <span className="capitalize">{companion.mood}</span>
                </span>
              )}
            </div>
            <p className="text-sm italic leading-relaxed">"{comment}"</p>
          </div>
        </div>
        
        {/* Affinity indicator */}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-60">
          <div className="flex-1 h-1 bg-background/30 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                companion.affinity > 50 ? "bg-green-400" :
                companion.affinity > 0 ? "bg-blue-400" :
                companion.affinity > -30 ? "bg-yellow-400" : "bg-red-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, (companion.affinity + 100) / 2)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span>{companion.affinity > 0 ? '+' : ''}{companion.affinity}</span>
        </div>
      </motion.div>
    );
  }

  // Default: inline variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "my-2 pl-4 border-l-2 py-2 rounded-r-lg",
        moodStyle
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-3 h-3" />
        <span className="font-medium text-sm">{companion.name}</span>
        {showMoodIndicator && (
          <span className="text-xs opacity-70">{moodEmojis[companion.mood]}</span>
        )}
      </div>
      <p className="text-sm italic">"{comment}"</p>
    </motion.div>
  );
}

// Wrapper for multiple companion comments in narrative
interface CompanionCommentsBlockProps {
  comments: Array<{ companion: CompanionState; comment: string }>;
}

export function CompanionCommentsBlock({ comments }: CompanionCommentsBlockProps) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      <AnimatePresence mode="popLayout">
        {comments.map((item, index) => (
          <CompanionCommentary
            key={`${item.companion.id}-${index}`}
            companion={item.companion}
            comment={item.comment}
            variant="inline"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
