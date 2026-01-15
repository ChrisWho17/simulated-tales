import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Sparkles, 
  Terminal, Backpack, User, BookOpen, Bookmark, 
  Settings, Keyboard, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_COMPLETED_KEY = 'untold-onboarding-completed';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector to highlight
  position?: 'center' | 'bottom' | 'top';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Adventure',
    description: 'This is your story. Every choice you make shapes the narrative. Let\'s learn the basics to get you started.',
    icon: <Sparkles className="w-8 h-8" />,
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
    title: 'You\'re Ready!',
    description: 'Your adventure awaits. Remember: there are no wrong choices, only different paths. Good luck, adventurer!',
    icon: <Zap className="w-8 h-8" />,
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

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[var(--accent-secondary)]/10 rounded-full blur-3xl" />
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
