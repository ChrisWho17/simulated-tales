import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  Terminal, Backpack, User, BookOpen, Bookmark, 
  Settings, Keyboard, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ONBOARDING_COMPLETED_KEY = 'untold-onboarding-completed';

// ============================================================================
// PAGE TURN ANIMATION - Book-like page flip effect
// ============================================================================

interface PageTurnProps {
  direction: 'forward' | 'backward';
  isAnimating: boolean;
}

function PageTurnEffect({ direction, isAnimating }: PageTurnProps) {
  if (!isAnimating) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Page turning shadow overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"
      />
      
      {/* The turning page */}
      <motion.div
        initial={{ 
          rotateY: direction === 'forward' ? 0 : -180,
          originX: direction === 'forward' ? 1 : 0,
        }}
        animate={{ 
          rotateY: direction === 'forward' ? -180 : 0,
        }}
        transition={{ 
          duration: 0.6, 
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1200,
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Front of page */}
        <div 
          className="absolute inset-8 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
            backfaceVisibility: 'hidden',
            boxShadow: direction === 'forward' 
              ? '-10px 0 30px rgba(0,0,0,0.3)' 
              : '10px 0 30px rgba(0,0,0,0.3)',
          }}
        />
        
        {/* Back of page */}
        <div 
          className="absolute inset-8 rounded-lg"
          style={{
            background: 'linear-gradient(225deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: direction === 'forward' 
              ? '10px 0 30px rgba(0,0,0,0.3)' 
              : '-10px 0 30px rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>

      {/* Page edge highlights during turn */}
      <motion.div
        initial={{ opacity: 0, x: direction === 'forward' ? '100%' : '-100%' }}
        animate={{ 
          opacity: [0, 0.8, 0],
          x: direction === 'forward' ? [null, '50%', '0%'] : [null, '-50%', '0%'],
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="absolute inset-y-8 w-1 bg-gradient-to-b from-transparent via-primary/60 to-transparent"
        style={{ 
          [direction === 'forward' ? 'right' : 'left']: '2rem',
        }}
      />

      {/* Dust particles released during page turn */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            x: direction === 'forward' ? '60%' : '40%',
            y: '50%',
            scale: 0,
          }}
          animate={{ 
            opacity: [0, 0.8, 0],
            x: `${30 + Math.random() * 40}%`,
            y: `${20 + Math.random() * 60}%`,
            scale: [0, 1, 0.5],
          }}
          transition={{ 
            duration: 0.8 + Math.random() * 0.4,
            delay: 0.1 + i * 0.03,
            ease: 'easeOut',
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/70"
          style={{
            boxShadow: '0 0 4px hsl(var(--primary) / 0.5)',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// TUTORIAL PARTICLES - Magical dust effect for the onboarding
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function TutorialParticles({ intensity = 1 }: { intensity?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate initial particles
    const count = Math.floor(40 * intensity);
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
    setParticles(newParticles);
  }, [intensity]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 70%, transparent 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--primary) / 0.5)`,
          }}
          animate={{
            y: [0, -30, -60, -30, 0],
            x: [0, 10, -10, 5, 0],
            opacity: [0, particle.opacity, particle.opacity * 0.8, particle.opacity, 0],
            scale: [0.5, 1, 1.2, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Floating dust motes - book dust effect */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 rounded-full bg-amber-200/60"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${30 + Math.random() * 40}%`,
          }}
          animate={{
            y: [0, -80 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 60],
            opacity: [0, 0.8, 0.6, 0],
            scale: [0, 1, 0.8, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  position?: 'center' | 'bottom' | 'top';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'A Story Awaits...',
    description: 'The dust settles as ancient pages stir to life. Every choice you make shapes the narrative ahead.',
    icon: <BookOpen className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'input',
    title: 'The Story Input',
    description: 'Type what you want to do here. Be creative! You can speak, act, explore, or interact with anything in the world.',
    icon: <Terminal className="w-8 h-8" />,
    position: 'bottom',
  },
  {
    id: 'commands',
    title: 'Slash Commands',
    description: 'Type special commands for quick actions:\n• /recap - Story summary\n• /inventory - Open bags\n• /stats - Character sheet\n• /help - Command list',
    icon: <Terminal className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'inventory',
    title: 'Your Inventory',
    description: 'Press Ctrl/⌘ + I or type /inventory to manage your items. Everything you collect goes here.',
    icon: <Backpack className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'character',
    title: 'Character Sheet',
    description: 'Press Ctrl/⌘ + K or type /stats to view your character\'s abilities, relationships, and progress.',
    icon: <User className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'bookmarks',
    title: 'Bookmark Moments',
    description: 'Save important story moments with bookmarks (Ctrl/⌘ + B). Never lose track of pivotal decisions.',
    icon: <Bookmark className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Open Settings to adjust dice modes, enable mature content, change themes, and explore the Tutorial tab for more tips.',
    icon: <Settings className="w-8 h-8" />,
    position: 'center',
  },
  {
    id: 'ready',
    title: 'The Pages Turn...',
    description: 'Your story begins now. Remember: there are no wrong choices, only different paths. The book is yours to write.',
    icon: <Sparkles className="w-8 h-8" />,
    position: 'center',
  },
];

interface OnboardingOverlayProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export function OnboardingOverlay({ onComplete, forceShow = false }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
      return;
    }

    // Check if onboarding was completed
    const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsVisible(false);
    onComplete();
  }, [onComplete]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsVisible(false);
    
    // Show achievement toast for completing tutorial
    toast('📕 Achievement Unlocked!', {
      description: 'Dust Off the Cover — You\'ve opened the book. Your story begins now.',
      duration: 5000,
    });
    
    // Dispatch event for achievement system to pick up
    window.dispatchEvent(new CustomEvent('tutorial-completed'));
    
    onComplete();
  }, [onComplete]);

  const triggerPageTurn = useCallback((direction: 'forward' | 'backward', callback: () => void) => {
    setTurnDirection(direction);
    setIsPageTurning(true);
    
    // Change step mid-animation for seamless transition
    setTimeout(() => {
      callback();
    }, 300);
    
    // End animation
    setTimeout(() => {
      setIsPageTurning(false);
    }, 600);
  }, []);

  const handleNext = useCallback(() => {
    if (isPageTurning) return;
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      triggerPageTurn('forward', () => {
        setCurrentStep(prev => prev + 1);
      });
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete, isPageTurning, triggerPageTurn]);

  const handlePrev = useCallback(() => {
    if (isPageTurning) return;
    
    if (currentStep > 0) {
      triggerPageTurn('backward', () => {
        setCurrentStep(prev => prev - 1);
      });
    }
  }, [currentStep, isPageTurning, triggerPageTurn]);

  const step = ONBOARDING_STEPS[currentStep];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        {/* Page turn animation */}
        <PageTurnEffect direction={turnDirection} isAnimating={isPageTurning} />
        
        {/* Magical particle effects */}
        <TutorialParticles intensity={currentStep === 0 || currentStep === ONBOARDING_STEPS.length - 1 ? 1.5 : 0.8} />
        
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground gap-1"
        >
          Skip Tutorial
          <X className="w-4 h-4" />
        </Button>

        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {ONBOARDING_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'bg-[var(--accent-primary)] w-6' 
                  : idx < currentStep 
                    ? 'bg-[var(--accent-primary)]/50' 
                    : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Main content card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="glass-panel p-8 text-center space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <div className="text-white">
                {step.icon}
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-display text-foreground"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground whitespace-pre-line leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Step counter */}
            <div className="text-xs text-muted-foreground">
              {currentStep + 1} of {ONBOARDING_STEPS.length}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 justify-center pt-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="gap-1 min-w-[120px]"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <>
                    Begin Adventure
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Keyboard hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="w-3 h-3" />
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted/30 border border-border/50">→</kbd> for next</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setShowOnboarding(true);
  };

  const triggerOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    resetOnboarding,
    triggerOnboarding,
    completeOnboarding,
  };
}
