import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Feather, BookOpen, Scroll, Wand2 } from 'lucide-react';

interface NarrativeLoadingIndicatorProps {
  isInitial?: boolean;
  genre?: string;
  className?: string;
}

// Rotating flavor messages for each genre
const LOADING_MESSAGES: Record<string, string[]> = {
  fantasy: [
    "The quill dances across parchment...",
    "Ancient magic weaves your tale...",
    "The bard considers their next verse...",
    "Fate threads your destiny...",
    "The story crystalizes from the aether...",
  ],
  scifi: [
    "Quantum narrative matrices aligning...",
    "Synthesizing story vectors...",
    "Neural pathways converging...",
    "Probability wave collapsing...",
    "Timeline synchronization in progress...",
  ],
  horror: [
    "Something stirs in the darkness...",
    "The shadows whisper secrets...",
    "An unseen presence watches...",
    "The veil between worlds thins...",
    "Dread takes form...",
  ],
  western: [
    "The wind carries tales across the plains...",
    "Dust settles on the frontier...",
    "A story rides in from the horizon...",
    "The desert whispers its secrets...",
    "Legends take root in dry soil...",
  ],
  noir: [
    "Rain traces words on dirty windows...",
    "The city breathes its confession...",
    "Shadows cast their judgment...",
    "Truth emerges from the smoke...",
    "The night tells its story...",
  ],
  cyberpunk: [
    "Data streams coalesce...",
    "Neural interface buffering...",
    "Reality subroutines compiling...",
    "Narrative protocols engaged...",
    "Chrome dreams rendering...",
  ],
  romance: [
    "Hearts flutter with anticipation...",
    "Destiny intertwines two souls...",
    "Emotions color the moment...",
    "The story takes a tender turn...",
    "Passion writes the next chapter...",
  ],
  modern: [
    "Life writes its next chapter...",
    "The world spins its tale...",
    "Reality unfolds around you...",
    "Moments crystallize into memory...",
    "Your story continues...",
  ],
  default: [
    "The story unfolds...",
    "Words take shape...",
    "Your tale continues...",
    "The narrative weaves forward...",
    "Adventure awaits...",
  ],
};

// Initial loading messages (more dramatic)
const INITIAL_MESSAGES: Record<string, string[]> = {
  fantasy: [
    "A tale of legend begins...",
    "Ancient scrolls reveal your destiny...",
    "The world awakens to your presence...",
  ],
  scifi: [
    "Initializing universe parameters...",
    "Reality matrix constructing...",
    "Your journey through the stars begins...",
  ],
  horror: [
    "The nightmare takes form...",
    "Something old awakens...",
    "Your story bleeds into existence...",
  ],
  western: [
    "The frontier awaits a new legend...",
    "A lone figure rides into history...",
    "The wild calls your name...",
  ],
  noir: [
    "The city opens its dark heart...",
    "A story darker than the night begins...",
    "Shadows welcome you to their world...",
  ],
  cyberpunk: [
    "Jacking into the narrative matrix...",
    "Your chrome story boots up...",
    "The neon world flickers to life...",
  ],
  romance: [
    "A love story begins to bloom...",
    "Two paths destined to cross...",
    "Hearts ready for adventure...",
  ],
  modern: [
    "A new chapter of life opens...",
    "The world awaits your story...",
    "Reality bends to your choices...",
  ],
  default: [
    "Your story is being written...",
    "A new adventure begins...",
    "The tale takes shape...",
  ],
};

const ICONS = [Sparkles, Feather, BookOpen, Scroll, Wand2];

export function NarrativeLoadingIndicator({ 
  isInitial = false, 
  genre = 'default',
  className = '' 
}: NarrativeLoadingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);
  
  // Get messages for current genre
  const messages = useMemo(() => {
    const normalizedGenre = genre.toLowerCase();
    const messagePool = isInitial ? INITIAL_MESSAGES : LOADING_MESSAGES;
    return messagePool[normalizedGenre] || messagePool.default;
  }, [genre, isInitial]);
  
  // Rotate messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
      setIconIndex(prev => (prev + 1) % ICONS.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [messages.length]);
  
  const CurrentIcon = ICONS[iconIndex];
  
  if (isInitial) {
    // Full-screen dramatic loading for initial story generation
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: 80, height: 80, margin: -16 }}
          />
          
          {/* Inner spinning icon */}
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center backdrop-blur-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={iconIndex}
                initial={{ scale: 0, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentIcon className="w-8 h-8 text-primary" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          
          {/* Orbiting particles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{ top: '50%', left: '50%' }}
              animate={{
                x: [0, 40, 0, -40, 0],
                y: [-40, 0, 40, 0, -40],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 1,
              }}
            />
          ))}
        </motion.div>
        
        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-muted-foreground font-narrative text-lg text-center italic"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
        
        {/* Subtle dots progress */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Inline loading indicator for ongoing generation
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        inline-flex items-center gap-3 
        glass-panel-subtle px-5 py-3 rounded-xl
        border border-primary/20
        ${className}
      `}
    >
      {/* Animated icon */}
      <motion.div
        className="relative"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={iconIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentIcon className="w-5 h-5 text-primary" />
          </motion.div>
        </AnimatePresence>
        
        {/* Sparkle effect */}
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <Sparkles className="w-2 h-2 text-primary" />
        </motion.div>
      </motion.div>
      
      {/* Message with typing dots */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={messageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="font-narrative italic text-primary/90"
          >
            {messages[messageIndex]}
          </motion.span>
        </AnimatePresence>
        
        {/* Typing dots */}
        <div className="flex gap-0.5 ml-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-primary/60"
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
